import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import prisma from './prisma';

function slugifyUsername(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20);
  return base.length >= 3 ? base : `user_${Math.floor(1000 + Math.random() * 9000)}`;
}

async function generateUniqueUsername(preferred: string): Promise<string> {
  let candidate = slugifyUsername(preferred);
  for (let i = 0; i < 10; i++) {
    const exists = await prisma.user.findUnique({ where: { username: candidate } });
    if (!exists) return candidate;
    candidate = `${slugifyUsername(preferred).slice(0, 15)}_${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return `user_${Date.now().toString(36)}`;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        const { recordFailedLogin } = await import('./trackLogin');

        if (!user) {
          await recordFailedLogin({ email: credentials.email.toLowerCase(), reason: 'unknown_email' });
          throw new Error('Invalid email or password');
        }

        if (user.passwordHash.startsWith('google-oauth')) {
          await recordFailedLogin({ email: user.email, userId: user.id, reason: 'google_only' });
          throw new Error('This account uses Google sign-in. Please continue with Google.');
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isCorrectPassword) {
          await recordFailedLogin({ email: user.email, userId: user.id, reason: 'wrong_password' });
          throw new Error('Invalid email or password');
        }

        // Silent login tracking (IP/location/ISP → DB only, never blocks login)
        const { recordLogin } = await import('./trackLogin');
        await recordLogin(user.id, 'login');

        return {
          id: user.id,
          email: user.email,
          name: user.username,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user?.email) {
        try {
          const email = user.email.toLowerCase();
          const existingUser = await prisma.user.findUnique({
            where: { email },
          });

          if (!existingUser) {
            const preferred =
              (user.name as string) || email.split('@')[0];
            const username = await generateUniqueUsername(preferred);
            const newUser = await prisma.user.create({
              data: {
                username,
                email,
                passwordHash: 'google-oauth-pending',
                image: (user as any).image || null,
                authProvider: 'google',
                needsOnboarding: true,
              },
            });
            (user as any).id = newUser.id;
            const { recordLogin } = await import('./trackLogin');
            await recordLogin(newUser.id, 'signup');
          } else {
            (user as any).id = existingUser.id;
            const { recordLogin } = await import('./trackLogin');
            await recordLogin(existingUser.id, 'login');
            // backfill provider/image for older google users
            if (existingUser.authProvider === 'credentials' && !existingUser.image && (user as any).image) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  image: (user as any).image,
                  authProvider: existingUser.passwordHash.startsWith('google-oauth') ? 'google' : 'both',
                },
              });
            }
          }
        } catch (error) {
          console.error('Google sign-in error:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { username: true, needsOnboarding: true, image: true, authProvider: true },
        });
        if (dbUser) {
          session.user.name = dbUser.username;
          (session.user as any).needsOnboarding = dbUser.needsOnboarding;
          (session.user as any).authProvider = dbUser.authProvider;
          if (dbUser.image) {
            (session.user as any).image = dbUser.image;
          }
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // send fresh google users to onboarding
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'cloudshare-secret-key-stable-do-not-change-2024',
  debug: false,
};

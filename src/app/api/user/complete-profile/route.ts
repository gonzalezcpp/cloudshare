import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain a number';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain a special character';
  return null;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { username, password } = await req.json();
    const cleanUsername = (username || '').trim();

    if (!cleanUsername || cleanUsername.length < 3) {
      return NextResponse.json({ success: false, error: 'Username must be at least 3 characters' }, { status: 400 });
    }
    if (/[^a-zA-Z0-9_]/.test(cleanUsername)) {
      return NextResponse.json({ success: false, error: 'Username can only contain letters, numbers, and underscores' }, { status: 400 });
    }

    const taken = await prisma.user.findFirst({
      where: { username: cleanUsername, id: { not: session.user.id } },
    });
    if (taken) {
      return NextResponse.json({ success: false, error: 'Username already taken' }, { status: 400 });
    }

    const data: any = { username: cleanUsername, needsOnboarding: false };

    if (password) {
      const pwError = validatePassword(password);
      if (pwError) {
        return NextResponse.json({ success: false, error: pwError }, { status: 400 });
      }
      data.passwordHash = await bcrypt.hash(password, 12);
      const current = await prisma.user.findUnique({ where: { id: session.user.id } });
      data.authProvider = current?.authProvider === 'google' ? 'both' : (current?.authProvider || 'credentials');
    }

    const user = await prisma.user.update({ where: { id: session.user.id }, data });

    return NextResponse.json({
      success: true,
      data: { username: user.username, authProvider: user.authProvider },
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save profile' }, { status: 500 });
  }
}

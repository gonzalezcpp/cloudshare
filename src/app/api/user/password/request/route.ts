import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const email = user.email.toLowerCase();

    await prisma.verificationCode.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    const code = generateCode();
    await prisma.verificationCode.create({
      data: { email, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });

    const sent = await sendVerificationEmail(email, code);
    if (!sent) {
      return NextResponse.json(
        { success: false, error: 'Could not send OTP email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Password OTP request error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send OTP' }, { status: 500 });
  }
}

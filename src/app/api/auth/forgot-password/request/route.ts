import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    // Always return success to avoid account enumeration.
    // Only send an OTP when the account actually exists.
    if (user) {
      await prisma.verificationCode.updateMany({
        where: { email: cleanEmail, used: false },
        data: { used: true },
      });

      const code = generateCode();
      await prisma.verificationCode.create({
        data: { email: cleanEmail, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
      });

      await sendVerificationEmail(cleanEmail, code);
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists for this email, an OTP has been sent.',
    });
  } catch (error) {
    console.error('Forgot password request error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send OTP' }, { status: 500 });
  }
}

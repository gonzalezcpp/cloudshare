import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Invalidate any previous codes for this email
    await prisma.verificationCode.updateMany({
      where: { email: email.toLowerCase(), used: false },
      data: { used: true },
    });

    // Generate and store new code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.verificationCode.create({
      data: {
        email: email.toLowerCase(),
        code,
        expiresAt,
      },
    });

    // Return code so client can send via EmailJS
    return NextResponse.json({
      success: true,
      code: code,
      message: 'Verification code generated',
    });
  } catch (error) {
    console.error('Generate verification code error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

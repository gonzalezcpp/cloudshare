import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    return NextResponse.json({
      success: true,
      exists: !!user,
    });
  } catch (error) {
    console.error('Check email error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check email' },
      { status: 500 }
    );
  }
}

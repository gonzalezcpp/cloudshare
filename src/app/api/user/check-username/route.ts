import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const username = (searchParams.get('username') || '').trim();

    if (!username || username.length < 3) {
      return NextResponse.json({ success: true, data: { available: false, reason: 'Too short' } });
    }
    if (/[^a-zA-Z0-9_]/.test(username)) {
      return NextResponse.json({ success: true, data: { available: false, reason: 'Only letters, numbers, underscores' } });
    }

    const existing = await prisma.user.findFirst({
      where: { username, id: { not: session.user.id } },
    });

    return NextResponse.json({ success: true, data: { available: !existing } });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to check username' }, { status: 500 });
  }
}

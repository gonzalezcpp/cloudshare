import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Own activity only. Never exposes other users' rows or owner-intel fields.
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const before = searchParams.get('before');
    const take = Math.min(Number(searchParams.get('take') || 50), 100);

    const items = await prisma.userActivity.findMany({
      where: {
        userId: session.user.id,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      select: {
        id: true,
        eventType: true,
        resourceName: true,
        ip: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
    });

    const hasMore = items.length > take;
    const page = hasMore ? items.slice(0, take) : items;

    return NextResponse.json({
      success: true,
      data: {
        items: page,
        hasMore,
        nextBefore: hasMore ? page[page.length - 1].createdAt : null,
      },
    });
  } catch (error) {
    console.error('Fetch activity error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch activity' }, { status: 500 });
  }
}

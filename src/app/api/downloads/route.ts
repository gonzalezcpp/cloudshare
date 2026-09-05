import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const downloads = await prisma.downloadHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const formatted = downloads.map((d) => ({
      id: d.id,
      fileName: d.fileName,
      fileSize: Number(d.fileSize),
      createdAt: d.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error('Download history error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch download history' },
      { status: 500 }
    );
  }
}

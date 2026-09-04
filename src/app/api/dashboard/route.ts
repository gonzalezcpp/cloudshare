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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const totalFiles = await prisma.file.count({
      where: { ownerId: session.user.id },
    });

    const totalFolders = await prisma.folder.count({
      where: { ownerId: session.user.id },
    });

    const downloadResult = await prisma.shareLink.aggregate({
      where: {
        ownerId: session.user.id,
      },
      _sum: {
        downloadCount: true,
      },
    });

    const recentFiles = (await prisma.file.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })).map(f => ({ ...f, size: Number(f.size) }));

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalFiles,
          totalFolders,
          storageUsed: user.storageUsed.toString(),
          storageLimit: user.storageLimit.toString(),
          totalDownloads: downloadResult._sum.downloadCount || 0,
        },
        recentFiles,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

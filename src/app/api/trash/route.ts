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

    const files = await prisma.file.findMany({
      where: { ownerId: session.user.id, deletedAt: { not: null } },
      include: { folder: true },
      orderBy: { deletedAt: 'desc' },
    });

    const folders = await prisma.folder.findMany({
      where: { ownerId: session.user.id, deletedAt: { not: null } },
      include: { _count: { select: { files: true } } },
      orderBy: { deletedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        files: files.map((f) => ({ ...f, size: Number(f.size) })),
        folders,
      },
    });
  } catch (error) {
    console.error('Fetch trash error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch trash' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const trashedFiles = await prisma.file.findMany({
      where: { ownerId: session.user.id, deletedAt: { not: null } },
    });

    let freed = 0;
    for (const file of trashedFiles) {
      try {
        if (!file.storagePath.startsWith('db:') && !file.storagePath.startsWith('ut:')) {
          if (process.env.SUPABASE_URL && file.storagePath.includes('/')) {
            const { deleteFromSupabase } = await import('@/lib/storage');
            await deleteFromSupabase(file.storagePath);
          } else if (process.env.AWS_ACCESS_KEY_ID) {
            const { deleteFromS3 } = await import('@/lib/s3');
            await deleteFromS3(file.storagePath);
          }
        }
      } catch (e) {
        console.error('Storage cleanup failed for', file.id, e);
      }
      freed += Number(file.size);
    }

    await prisma.file.deleteMany({
      where: { ownerId: session.user.id, deletedAt: { not: null } },
    });
    await prisma.folder.deleteMany({
      where: { ownerId: session.user.id, deletedAt: { not: null } },
    });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    await prisma.user.update({
      where: { id: session.user.id },
      data: { storageUsed: Math.max(0, Number(user?.storageUsed || 0) - freed) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Empty trash error:', error);
    return NextResponse.json({ success: false, error: 'Failed to empty trash' }, { status: 500 });
  }
}

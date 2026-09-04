import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'createdAt';
    const direction = searchParams.get('direction') || 'desc';
    const folderId = searchParams.get('folderId');

    const where: any = {
      ownerId: session.user.id,
      ...(folderId ? { folderId } : { folderId: null }),
    };

    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { filename: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (sort === 'downloadCount') {
      orderBy.shareLinks = { _count: direction };
    } else {
      orderBy[sort] = direction;
    }

    const files = (await prisma.file.findMany({
      where,
      include: {
        shareLinks: true,
        folder: true,
      },
      orderBy,
    })).map(f => ({
      ...f,
      size: Number(f.size),
      shareLinks: f.shareLinks.map(s => ({ ...s })),
    }));

    const folders = await prisma.folder.findMany({
      where: {
        ownerId: session.user.id,
        parentId: folderId || null,
      },
      include: {
        _count: {
          select: { files: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: { files, folders },
    });
  } catch (error) {
    console.error('Fetch files error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

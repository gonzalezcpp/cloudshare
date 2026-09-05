import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, parentId } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Folder name is required' },
        { status: 400 }
      );
    }

    if (parentId) {
      const parentFolder = await prisma.folder.findUnique({
        where: { id: parentId },
      });

      if (!parentFolder || parentFolder.ownerId !== session.user.id) {
        return NextResponse.json(
          { success: false, error: 'Parent folder not found' },
          { status: 404 }
        );
      }
    }

    const folder = await prisma.folder.create({
      data: {
        ownerId: session.user.id,
        name: name.trim(),
        parentId: parentId || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: { id: folder.id, name: folder.name },
    });
  } catch (error) {
    console.error('Create folder error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const folders = await prisma.folder.findMany({
      where: {
        ownerId: session.user.id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: folders,
    });
  } catch (error) {
    console.error('Fetch folders error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch folders' },
      { status: 500 }
    );
  }
}

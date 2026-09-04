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

    const { storagePath, originalName, fileSize, fileType, folderId } = await req.json();

    if (!storagePath || !originalName || !fileSize) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
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

    const filename = storagePath.split('/').pop() || storagePath;

    const dbFile = await prisma.file.create({
      data: {
        ownerId: session.user.id,
        filename: filename,
        originalName: originalName,
        storagePath: storagePath,
        fileData: null,
        size: BigInt(fileSize),
        mimeType: fileType || 'application/octet-stream',
        folderId: folderId || null,
      },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        storageUsed: {
          increment: BigInt(fileSize),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: dbFile.id,
        filename: dbFile.filename,
        originalName: dbFile.originalName,
        size: Number(dbFile.size),
        mimeType: dbFile.mimeType,
      },
    });
  } catch (error) {
    console.error('Confirm upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to confirm upload' },
      { status: 500 }
    );
  }
}

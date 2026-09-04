import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const file = await prisma.file.findUnique({
      where: { id: params.id },
    });

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    if (file.ownerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (file.storagePath.startsWith('db:') || file.storagePath.startsWith('ut:')) {
      // db: and ut: files don't need external deletion
    } else if (process.env.SUPABASE_URL && file.storagePath.includes('/')) {
      const { deleteFromSupabase } = await import('@/lib/storage');
      await deleteFromSupabase(file.storagePath);
    } else if (process.env.AWS_ACCESS_KEY_ID) {
      const { deleteFromS3 } = await import('@/lib/s3');
      await deleteFromS3(file.storagePath);
    }

    await prisma.file.delete({
      where: { id: params.id },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        storageUsed: Math.max(0, Number(user?.storageUsed || 0) - Number(file.size)),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const file = await prisma.file.findUnique({
      where: { id: params.id },
    });

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    if (file.ownerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { filename, folderId } = body;

    const updateData: any = {};
    if (filename) updateData.originalName = filename;
    if (folderId !== undefined) updateData.folderId = folderId || null;

    const updatedFile = await prisma.file.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedFile.id,
        filename: updatedFile.filename,
        originalName: updatedFile.originalName,
      },
    });
  } catch (error) {
    console.error('Update file error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update file' },
      { status: 500 }
    );
  }
}

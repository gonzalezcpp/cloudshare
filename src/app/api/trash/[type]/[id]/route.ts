import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

async function permanentlyDeleteFile(fileId: string) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) return null;
  if (!file.storagePath.startsWith('db:') && !file.storagePath.startsWith('ut:')) {
    try {
      if (process.env.SUPABASE_URL && file.storagePath.includes('/')) {
        const { deleteFromSupabase } = await import('@/lib/storage');
        await deleteFromSupabase(file.storagePath);
      } else if (process.env.AWS_ACCESS_KEY_ID) {
        const { deleteFromS3 } = await import('@/lib/s3');
        await deleteFromS3(file.storagePath);
      }
    } catch (e) {
      console.error('Storage cleanup failed', e);
    }
  }
  await prisma.file.delete({ where: { id: fileId } });
  return file;
}

export async function DELETE(
  req: Request,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { type, id } = params;
    if (!['file', 'folder'].includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
    }

    const { logActivity } = await import('@/lib/activity');
    if (type === 'file') {
      const file = await prisma.file.findUnique({ where: { id } });
      if (!file || file.ownerId !== session.user.id) {
        return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
      }
      await permanentlyDeleteFile(id);
      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      await prisma.user.update({
        where: { id: session.user.id },
        data: { storageUsed: Math.max(0, Number(user?.storageUsed || 0) - Number(file.size)) },
      });
      await logActivity({ userId: session.user.id, eventType: 'file_delete', resource: id, resourceName: file.originalName, metadata: { permanent: true, fromTrash: true } });
    } else {
      const folder = await prisma.folder.findUnique({
        where: { id },
        include: { files: true },
      });
      if (!folder || folder.ownerId !== session.user.id) {
        return NextResponse.json({ success: false, error: 'Folder not found' }, { status: 404 });
      }
      let freed = 0;
      for (const f of folder.files) {
        await permanentlyDeleteFile(f.id);
        freed += Number(f.size);
      }
      await prisma.folder.delete({ where: { id } });
      if (freed > 0) {
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        await prisma.user.update({
          where: { id: session.user.id },
          data: { storageUsed: Math.max(0, Number(user?.storageUsed || 0) - freed) },
        });
      }
      await logActivity({ userId: session.user.id, eventType: 'folder_delete', resource: id, resourceName: folder.name, metadata: { permanent: true, fromTrash: true } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Permanent delete error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 });
  }
}

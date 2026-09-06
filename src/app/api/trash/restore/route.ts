import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { type, id } = await req.json();
    if (!type || !id || !['file', 'folder'].includes(type)) {
      return NextResponse.json({ success: false, error: 'type (file|folder) and id required' }, { status: 400 });
    }

    const { logActivity } = await import('@/lib/activity');
    if (type === 'file') {
      const file = await prisma.file.findUnique({ where: { id } });
      if (!file || file.ownerId !== session.user.id) {
        return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
      }
      await prisma.file.update({ where: { id }, data: { deletedAt: null } });
      await logActivity({ userId: session.user.id, eventType: 'file_restore', resource: id, resourceName: file.originalName });
    } else {
      const folder = await prisma.folder.findUnique({ where: { id } });
      if (!folder || folder.ownerId !== session.user.id) {
        return NextResponse.json({ success: false, error: 'Folder not found' }, { status: 404 });
      }
      await prisma.folder.update({ where: { id }, data: { deletedAt: null } });
      // also restore files that were trashed inside this folder
      await prisma.file.updateMany({
        where: { folderId: id, ownerId: session.user.id, deletedAt: { not: null } },
        data: { deletedAt: null },
      });
      await logActivity({ userId: session.user.id, eventType: 'folder_restore', resource: id, resourceName: folder.name });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Restore error:', error);
    return NextResponse.json({ success: false, error: 'Failed to restore' }, { status: 500 });
  }
}

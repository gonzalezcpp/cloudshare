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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const folder = await prisma.folder.findUnique({ where: { id: params.id } });
    if (!folder || folder.ownerId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Folder not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const permanent = searchParams.get('permanent') === 'true';

    if (!permanent) {
      await prisma.folder.update({
        where: { id: params.id },
        data: { deletedAt: new Date() },
      });
      // soft-delete files inside too so they disappear from listings
      await prisma.file.updateMany({
        where: { folderId: params.id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      const { logActivity } = await import('@/lib/activity');
      await logActivity({
        userId: session.user.id,
        eventType: 'folder_trash',
        resource: folder.id,
        resourceName: folder.name,
      });
      return NextResponse.json({ success: true, trashed: true });
    }

    // permanent
    const files = await prisma.file.findMany({ where: { folderId: params.id } });
    for (const f of files) {
      try {
        if (!f.storagePath.startsWith('db:') && !f.storagePath.startsWith('ut:')) {
          if (process.env.SUPABASE_URL && f.storagePath.includes('/')) {
            const { deleteFromSupabase } = await import('@/lib/storage');
            await deleteFromSupabase(f.storagePath);
          }
        }
      } catch {}
      await prisma.file.delete({ where: { id: f.id } });
    }
    await prisma.folder.delete({ where: { id: params.id } });
    const { logActivity } = await import('@/lib/activity');
    await logActivity({
      userId: session.user.id,
      eventType: 'folder_delete',
      resource: folder.id,
      resourceName: folder.name,
      metadata: { permanent: true },
    });
    return NextResponse.json({ success: true, trashed: false });
  } catch (error) {
    console.error('Delete folder error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete folder' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const folder = await prisma.folder.findUnique({ where: { id: params.id } });
    if (!folder || folder.ownerId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Folder not found' }, { status: 404 });
    }
    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'Name required' }, { status: 400 });
    }
    const updated = await prisma.folder.update({
      where: { id: params.id },
      data: { name: name.trim() },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to rename' }, { status: 500 });
  }
}

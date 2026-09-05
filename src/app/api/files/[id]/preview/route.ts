import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const file = await prisma.file.findUnique({ where: { id: params.id } });
    if (!file || file.ownerId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }
    if (file.deletedAt) {
      return NextResponse.json({ success: false, error: 'File is in trash' }, { status: 410 });
    }

    const storagePath: string = file.storagePath;
    const isDb = storagePath.startsWith('db:');
    const isUt = storagePath.startsWith('ut:');
    const isSupabase = !isDb && !isUt && storagePath.includes('/');

    let downloadUrl = '';
    if (isUt) {
      downloadUrl = `https://utfs.io/f/${storagePath.replace('ut:', '')}`;
    } else if (isDb) {
      const rec = await prisma.file.findUnique({ where: { id: file.id }, select: { fileData: true } });
      if (!rec?.fileData) {
        return NextResponse.json({ success: false, error: 'File data missing' }, { status: 404 });
      }
      downloadUrl = `data:${file.mimeType};base64,${rec.fileData.toString('base64')}`;
    } else if (isSupabase) {
      const { getSupabasePublicUrl } = await import('@/lib/storage');
      downloadUrl = getSupabasePublicUrl(storagePath);
    } else {
      const { getPublicUrl } = await import('@/lib/s3');
      downloadUrl = getPublicUrl(storagePath);
    }

    return NextResponse.json({
      success: true,
      data: {
        url: downloadUrl,
        mimeType: file.mimeType,
        name: file.originalName,
        size: Number(file.size),
      },
    });
  } catch (error) {
    console.error('Preview error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load preview' }, { status: 500 });
  }
}

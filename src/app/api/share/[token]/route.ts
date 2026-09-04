import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const shareLink = await prisma.shareLink.findUnique({
      where: { id: params.token },
    });

    if (!shareLink) {
      return NextResponse.json(
        { success: false, error: 'Share link not found' },
        { status: 404 }
      );
    }

    if (shareLink.ownerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await prisma.shareLink.delete({
      where: { id: params.token },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete share link error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete share link' },
      { status: 500 }
    );
  }
}

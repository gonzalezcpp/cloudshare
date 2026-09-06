import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hashPin, validatePin } from '@/lib/pins';

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

    const { logActivity } = await import('@/lib/activity');
    await logActivity({
      userId: session.user.id,
      eventType: 'share_deleted',
      resource: shareLink.id,
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

export async function PATCH(
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

    const body = await req.json();
    const updateData: any = {};

    if ('isActive' in body) {
      updateData.isActive = Boolean(body.isActive);
    }

    if ('pinProtected' in body || 'pin' in body) {
      const pinProtected = Boolean(body.pinProtected);
      updateData.pinProtected = pinProtected;
      if (pinProtected) {
        const validation = validatePin(body.pin);
        if (!validation.valid) {
          return NextResponse.json(
            { success: false, error: validation.error },
            { status: 400 }
          );
        }
        updateData.pinHash = await hashPin(body.pin);
      } else {
        updateData.pinHash = null;
      }
    }

    if ('expiresAt' in body) {
      if (body.expiresAt === null || body.expiresAt === '') {
        updateData.expiresAt = null;
      } else {
        const d = new Date(body.expiresAt);
        if (isNaN(d.getTime())) {
          return NextResponse.json(
            { success: false, error: 'Invalid expiration date' },
            { status: 400 }
          );
        }
        if (d.getTime() <= Date.now()) {
          return NextResponse.json(
            { success: false, error: 'Expiration must be in the future' },
            { status: 400 }
          );
        }
        updateData.expiresAt = d;
      }
    }

    if ('maxDownloads' in body) {
      if (body.maxDownloads === null || body.maxDownloads === '') {
        updateData.maxDownloads = null;
      } else {
        const n = Number(body.maxDownloads);
        if (!Number.isInteger(n) || n < 1 || n > 1000000) {
          return NextResponse.json(
            { success: false, error: 'Access limit must be a whole number between 1 and 1,000,000' },
            { status: 400 }
          );
        }
        if (n < shareLink.downloadCount) {
          return NextResponse.json(
            { success: false, error: `Limit cannot be below the current access count (${shareLink.downloadCount})` },
            { status: 400 }
          );
        }
        updateData.maxDownloads = n;
      }
    }

    const updated = await prisma.shareLink.update({
      where: { id: params.token },
      data: updateData,
    });

    const { logActivity } = await import('@/lib/activity');
    const changed = Object.keys(updateData);
    await logActivity({
      userId: session.user.id,
      eventType: 'isActive' in updateData && updateData.isActive === false ? 'share_disabled' : 'share_updated',
      resource: updated.id,
      metadata: { changed },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        pinProtected: updated.pinProtected,
        expiresAt: updated.expiresAt?.toISOString() || null,
        maxDownloads: updated.maxDownloads,
        isActive: updated.isActive,
        downloadCount: updated.downloadCount,
      },
    });
  } catch (error) {
    console.error('Update share link error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update share link' },
      { status: 500 }
    );
  }
}

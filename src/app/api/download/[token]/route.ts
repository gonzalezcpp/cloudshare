import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPin } from '@/lib/pins';
import { getRateLimitKey, checkRateLimit, logPinAttempt } from '@/lib/rateLimit';

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const shareLink = await prisma.shareLink.findUnique({
      where: { shareToken: params.token },
      include: { file: true },
    });

    if (!shareLink) {
      return NextResponse.json(
        { success: false, error: 'Share link not found' },
        { status: 404 }
      );
    }

    if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Share link has expired' },
        { status: 410 }
      );
    }

    if (
      shareLink.maxDownloads &&
      shareLink.downloadCount >= shareLink.maxDownloads
    ) {
      return NextResponse.json(
        { success: false, error: 'Download limit reached' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        fileName: shareLink.file.originalName,
        fileSize: shareLink.file.size.toString(),
        pinProtected: shareLink.pinProtected,
        downloads: shareLink.downloadCount,
        expiresAt: shareLink.expiresAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('Get share info error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get share info' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const shareLink = await prisma.shareLink.findUnique({
      where: { shareToken: params.token },
      include: { file: true },
    });

    if (!shareLink) {
      return NextResponse.json(
        { success: false, error: 'Share link not found' },
        { status: 404 }
      );
    }

    if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Share link has expired' },
        { status: 410 }
      );
    }

    if (
      shareLink.maxDownloads &&
      shareLink.downloadCount >= shareLink.maxDownloads
    ) {
      return NextResponse.json(
        { success: false, error: 'Download limit reached' },
        { status: 410 }
      );
    }

    if (shareLink.pinProtected) {
      const { pin } = await req.json();

      if (!pin || pin.length !== 6) {
        return NextResponse.json(
          { success: false, error: 'PIN must be exactly 6 characters' },
          { status: 400 }
        );
      }

      const ipAddress =
        req.headers.get('x-forwarded-for') ||
        req.headers.get('x-real-ip') ||
        'unknown';

      const rateLimitKey = getRateLimitKey(shareLink.id, ipAddress);
      const { allowed, remaining } = checkRateLimit(rateLimitKey);

      if (!allowed) {
        return NextResponse.json(
          {
            success: false,
            error: 'Too many failed attempts. Please try again later.',
          },
          { status: 429 }
        );
      }

      const isValid = await verifyPin(pin, shareLink.pinHash || '');

      await logPinAttempt(shareLink.id, ipAddress, isValid);

      if (!isValid) {
        return NextResponse.json(
          {
            success: false,
            error: 'Incorrect PIN. Please try again.',
            remaining,
          },
          { status: 401 }
        );
      }
    }

    await prisma.shareLink.update({
      where: { id: shareLink.id },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    });

    // Log download history for the file owner
    try {
      await prisma.downloadHistory.create({
        data: {
          userId: shareLink.ownerId,
          fileId: shareLink.file.id,
          fileName: shareLink.file.originalName,
          fileSize: shareLink.file.size,
          shareLinkId: shareLink.id,
          ipAddress:
            req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            'unknown',
        },
      });
    } catch (e) {
      console.error('Failed to log download history:', e);
    }

    const isDbStorage = shareLink.file.storagePath.startsWith('db:');
    const isUploadthing = shareLink.file.storagePath.startsWith('ut:');
    const isSupabase = !isDbStorage && !isUploadthing && shareLink.file.storagePath.includes('/');

    if (isUploadthing) {
      const fileKey = shareLink.file.storagePath.replace('ut:', '');
      const downloadUrl = `https://utfs.io/f/${fileKey}`;

      return NextResponse.json({
        success: true,
        data: {
          downloadUrl,
          fileName: shareLink.file.originalName,
        },
      });
    }

    if (isDbStorage) {
      const fileRecord = await prisma.file.findUnique({
        where: { id: shareLink.file.id },
        select: { fileData: true },
      });

      if (!fileRecord?.fileData) {
        return NextResponse.json(
          { success: false, error: 'File data not found' },
          { status: 404 }
        );
      }

      const base64Data = fileRecord.fileData.toString('base64');
      const dataUrl = `data:${shareLink.file.mimeType};base64,${base64Data}`;

      return NextResponse.json({
        success: true,
        data: {
          downloadUrl: dataUrl,
          fileName: shareLink.file.originalName,
        },
      });
    }

    if (isSupabase) {
      const { getSupabasePublicUrl } = await import('@/lib/storage');
      const downloadUrl = getSupabasePublicUrl(shareLink.file.storagePath);

      return NextResponse.json({
        success: true,
        data: {
          downloadUrl,
          fileName: shareLink.file.originalName,
        },
      });
    }

    const { getPublicUrl } = await import('@/lib/s3');
    const downloadUrl = getPublicUrl(shareLink.file.storagePath);

    return NextResponse.json({
      success: true,
      data: {
        downloadUrl,
        fileName: shareLink.file.originalName,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { success: false, error: 'Download failed' },
      { status: 500 }
    );
  }
}

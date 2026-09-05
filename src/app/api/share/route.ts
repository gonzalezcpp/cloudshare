import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateShareToken, hashPin, validatePin } from '@/lib/pins';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { fileId, folderId, destinationUrl, pinProtected, pin, maxDownloads, expiresAt } =
      await req.json();

    if (!fileId && !folderId && !destinationUrl) {
      return NextResponse.json(
        { success: false, error: 'File, folder, or URL is required' },
        { status: 400 }
      );
    }

    let cleanUrl: string | null = null;
    if (destinationUrl) {
      if (typeof destinationUrl !== 'string' || destinationUrl.length > 2048) {
        return NextResponse.json(
          { success: false, error: 'Invalid URL' },
          { status: 400 }
        );
      }
      let normalized = destinationUrl.trim();
      if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(normalized)) {
        normalized = `https://${normalized}`;
      }
      try {
        const parsed = new URL(normalized);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          throw new Error('bad protocol');
        }
        const host = parsed.hostname.toLowerCase();
        if (
          host === 'localhost' ||
          host.endsWith('.localhost') ||
          host === '127.0.0.1' ||
          host === '0.0.0.0' ||
          host.startsWith('10.') ||
          host.startsWith('192.168.') ||
          /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
          host === '[::1]'
        ) {
          return NextResponse.json(
            { success: false, error: 'URL must be a public web address' },
            { status: 400 }
          );
        }
        cleanUrl = parsed.toString();
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid URL. Use a full address like https://example.com' },
          { status: 400 }
        );
      }
    }

    if (fileId) {
      const file = await prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file || (file as any).deletedAt) {
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
    }

    if (folderId) {
      const folder = await prisma.folder.findUnique({
        where: { id: folderId },
      });

      if (!folder || (folder as any).deletedAt) {
        return NextResponse.json(
          { success: false, error: 'Folder not found' },
          { status: 404 }
        );
      }

      if (folder.ownerId !== session.user.id) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }

    if (pinProtected) {
      const validation = validatePin(pin);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 }
        );
      }
    }

    const { getPlan } = await import('@/lib/plans');
    const sharer = await prisma.user.findUnique({ where: { id: session.user.id } });
    const sharePlan = getPlan(sharer?.plan);
    if (sharePlan.maxShares !== null) {
      const linkCount = await prisma.shareLink.count({ where: { ownerId: session.user.id } });
      if (linkCount >= sharePlan.maxShares) {
        return NextResponse.json(
          { success: false, error: `Free plan allows ${sharePlan.maxShares} share links. Upgrade to Pro for unlimited sharing.`, upgrade: true },
          { status: 403 }
        );
      }
    }

    let parsedExpiry: Date | null = null;
    if (expiresAt) {
      parsedExpiry = new Date(expiresAt);
      if (isNaN(parsedExpiry.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid expiration date' },
          { status: 400 }
        );
      }
      if (parsedExpiry.getTime() <= Date.now()) {
        return NextResponse.json(
          { success: false, error: 'Expiration must be in the future' },
          { status: 400 }
        );
      }
    }

    let parsedLimit: number | null = null;
    if (maxDownloads !== undefined && maxDownloads !== null && maxDownloads !== '') {
      parsedLimit = Number(maxDownloads);
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000000) {
        return NextResponse.json(
          { success: false, error: 'Access limit must be a whole number between 1 and 1,000,000' },
          { status: 400 }
        );
      }
    }

    const shareToken = generateShareToken();
    const pinHash = pinProtected && pin ? await hashPin(pin) : null;

    const shareLink = await prisma.shareLink.create({
      data: {
        fileId: fileId || null,
        folderId: folderId || null,
        destinationUrl: cleanUrl,
        ownerId: session.user.id,
        shareToken,
        pinProtected: pinProtected || false,
        pinHash,
        maxDownloads: parsedLimit,
        expiresAt: parsedExpiry,
      },
    });

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;
    const url = `${baseUrl}/d/${shareToken}`;

    return NextResponse.json({
      success: true,
      data: {
        id: shareLink.id,
        token: shareToken,
        url,
        pinProtected: shareLink.pinProtected,
        type: cleanUrl ? 'url' : folderId ? 'folder' : 'file',
      },
    });
  } catch (error) {
    console.error('Create share link error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create share link' },
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

    const shareLinks = (await prisma.shareLink.findMany({
      where: {
        ownerId: session.user.id,
      },
      include: {
        file: true,
        folder: {
          include: {
            files: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })).map(sl => ({
      ...sl,
      file: sl.file ? { ...sl.file, size: Number(sl.file.size) } : null,
      folder: sl.folder
        ? {
            ...sl.folder,
            files: sl.folder.files.map(f => ({
              ...f,
              size: Number(f.size),
            })),
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: shareLinks,
    });
  } catch (error) {
    console.error('Fetch share links error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch share links' },
      { status: 500 }
    );
  }
}

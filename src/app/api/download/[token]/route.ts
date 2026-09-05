import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPin } from '@/lib/pins';
import { getRateLimitKey, checkRateLimit, logPinAttempt } from '@/lib/rateLimit';

async function resolveDownloadUrl(file: any) {
  const storagePath: string = file.storagePath;
  const isDbStorage = storagePath.startsWith('db:');
  const isUploadthing = storagePath.startsWith('ut:');
  const isSupabase = !isDbStorage && !isUploadthing && storagePath.includes('/');

  if (isUploadthing) {
    const fileKey = storagePath.replace('ut:', '');
    return { downloadUrl: `https://utfs.io/f/${fileKey}`, mimeType: file.mimeType };
  }

  if (isDbStorage) {
    const fileRecord = await prisma.file.findUnique({
      where: { id: file.id },
      select: { fileData: true },
    });

    if (!fileRecord?.fileData) {
      throw new Error('File data not found');
    }

    const base64Data = fileRecord.fileData.toString('base64');
    return {
      downloadUrl: `data:${file.mimeType};base64,${base64Data}`,
      mimeType: file.mimeType,
    };
  }

  if (isSupabase) {
    const { getSupabasePublicUrl } = await import('@/lib/storage');
    return {
      downloadUrl: getSupabasePublicUrl(storagePath),
      mimeType: file.mimeType,
    };
  }

  const { getPublicUrl } = await import('@/lib/s3');
  return { downloadUrl: getPublicUrl(storagePath), mimeType: file.mimeType };
}

async function loadShareLink(token: string) {
  return prisma.shareLink.findUnique({
    where: { shareToken: token },
    include: {
      file: true,
      folder: {
        include: {
          files: true,
        },
      },
    },
  });
}

async function assertActive(shareLink: any) {
  if (!shareLink) {
    return { error: 'Share link not found', status: 404 as const };
  }
  if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
    return { error: 'Share link has expired', status: 410 as const };
  }
  if (
    shareLink.maxDownloads &&
    shareLink.downloadCount >= shareLink.maxDownloads
  ) {
    return { error: 'Download limit reached', status: 410 as const };
  }
  return { error: null, status: null as null };
}

async function verifySharePin(shareLink: any, req: Request) {
  if (!shareLink.pinProtected) return { ok: true };

  const { pin } = await req.json();

  if (!pin || pin.length !== 6) {
    return {
      ok: false,
      error: 'PIN must be exactly 6 characters',
      status: 400 as const,
    };
  }

  const ipAddress =
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    'unknown';

  const rateLimitKey = getRateLimitKey(shareLink.id, ipAddress);
  const { allowed, remaining } = checkRateLimit(rateLimitKey);

  if (!allowed) {
    return {
      ok: false,
      error: 'Too many failed attempts. Please try again later.',
      status: 429 as const,
    };
  }

  const isValid = await verifyPin(pin, shareLink.pinHash || '');

  await logPinAttempt(shareLink.id, ipAddress, isValid);

  if (!isValid) {
    return {
      ok: false,
      error: 'Incorrect PIN. Please try again.',
      status: 401 as const,
      remaining,
    };
  }

  return { ok: true };
}

function getClientIp(req: Request) {
  return (
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const shareLink = await loadShareLink(params.token);
    const active = await assertActive(shareLink);

    if (active.error || !shareLink) {
      return NextResponse.json(
        { success: false, error: active.error || 'Share link not found' },
        { status: active.status || 404 }
      );
    }

    if (shareLink.folderId && shareLink.folder) {
      const files = shareLink.folder.files.map((f) => ({
        id: f.id,
        name: f.originalName,
        size: f.size.toString(),
        mimeType: f.mimeType,
      }));

      const totalSize = files.reduce(
        (sum, f) => sum + BigInt(f.size),
        BigInt(0)
      );

      return NextResponse.json({
        success: true,
        data: {
          type: 'folder',
          folderName: shareLink.folder.name,
          pinProtected: shareLink.pinProtected,
          downloads: shareLink.downloadCount,
          expiresAt: shareLink.expiresAt?.toISOString() || null,
          fileCount: files.length,
          totalSize: totalSize.toString(),
          files,
        },
      });
    }

    if (!shareLink.file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        type: 'file',
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

async function logDownload(shareLink: any, file: any, req: Request) {
  try {
    await prisma.downloadHistory.create({
      data: {
        userId: shareLink.ownerId,
        fileId: file.id,
        fileName: file.originalName,
        fileSize: file.size,
        shareLinkId: shareLink.id,
        ipAddress: getClientIp(req),
      },
    });
  } catch (e) {
    console.error('Failed to log download history:', e);
  }
}

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const shareLink = await loadShareLink(params.token);
    const active = await assertActive(shareLink);

    if (active.error || !shareLink) {
      return NextResponse.json(
        { success: false, error: active.error || 'Share link not found' },
        { status: active.status || 404 }
      );
    }

    const pinResult = await verifySharePin(shareLink, req);
    if (!pinResult.ok) {
      return NextResponse.json(
        { success: false, error: pinResult.error, remaining: pinResult.remaining },
        { status: pinResult.status }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { fileId, mode } = body;

    await prisma.shareLink.update({
      where: { id: shareLink.id },
      data: { downloadCount: { increment: 1 } },
    });

    // Folder share ZIP download
    if (shareLink.folderId && mode === 'zip') {
      const files = shareLink.folder?.files || [];

      if (files.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Folder is empty' },
          { status: 400 }
        );
      }

      for (const f of files) {
        await logDownload(shareLink, f, req);
      }

      try {
        const archiver = (await import('archiver')) as unknown as (
          options?: any
        ) => any;
        const { Readable } = await import('stream');
        const { createClient } = await import('@supabase/supabase-js');

        const isNode = typeof process !== 'undefined' && !('EdgeRuntime' in (globalThis as any));
        if (!isNode) {
          throw new Error('Node runtime required for ZIP');
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
        const bucket = process.env.SUPABASE_BUCKET || 'cloudshare-files';

        if (!supabaseUrl || !supabaseServiceKey) {
          throw new Error('Supabase not configured');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const archiverFn = (await import('archiver')) as unknown as (...args: any[]) => any;
        const archive = archiverFn('zip', { zlib: { level: 6 } });

        const bufferPromises = files.map(async (f) => {
          const storagePath: string = f.storagePath;
          const isDbStorage = storagePath.startsWith('db:');
          const isUploadthing = storagePath.startsWith('ut:');
          const isSupabase = !isDbStorage && !isUploadthing && storagePath.includes('/');

          if (isDbStorage) {
            const fileRecord = await prisma.file.findUnique({
              where: { id: f.id },
              select: { fileData: true },
            });
            if (fileRecord?.fileData) {
              return { name: f.originalName, data: fileRecord.fileData };
            }
            return null;
          }

          if (isUploadthing) {
            const fileKey = storagePath.replace('ut:', '');
            const res = await fetch(`https://utfs.io/f/${fileKey}`);
            if (res.ok) {
              const data = Buffer.from(await res.arrayBuffer());
              return { name: f.originalName, data };
            }
            return null;
          }

          const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
          const res = await fetch(publicUrl);
          if (res.ok) {
            const data = Buffer.from(await res.arrayBuffer());
            return { name: f.originalName, data };
          }
          return null;
        });

        const results = await Promise.all(bufferPromises);
        const validFiles = results.filter((r): r is { name: string; data: Buffer } => r !== null);

        if (validFiles.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Could not load any files for download' },
            { status: 500 }
          );
        }

        for (const item of validFiles) {
          archive.append(item.data, { name: item.name });
        }

        const archivePromise = new Promise<Buffer>((resolve, reject) => {
          const chunks: Buffer[] = [];
          archive.on('data', (chunk: Buffer) => chunks.push(chunk));
          archive.on('end', () => resolve(Buffer.concat(chunks)));
          archive.on('error', reject);
          archive.finalize();
        });

        const zipBuffer = await archivePromise;

        const folderName = shareLink.folder?.name || 'folder';
        const sanitized = folderName.replace(/[^\w\-]+/g, '_');

        return new NextResponse(new Uint8Array(zipBuffer), {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${sanitized}.zip"`,
            'Content-Length': String(zipBuffer.byteLength),
          },
        });
      } catch (error) {
        console.error('ZIP creation error:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to create ZIP download' },
          { status: 500 }
        );
      }
    }

    // Folder share - specific file download
    if (shareLink.folderId) {
      let file = null;
      if (fileId) {
        file =
          shareLink.folder?.files.find((f) => f.id === fileId) || null;
      } else {
        // Default to first file if none specified
        file = shareLink.folder?.files[0] || null;
      }

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'File not found in folder' },
          { status: 404 }
        );
      }

      await logDownload(shareLink, file, req);

      const { downloadUrl, mimeType } = await resolveDownloadUrl(file);
      return NextResponse.json({
        success: true,
        data: {
          downloadUrl,
          fileName: file.originalName,
          mimeType,
        },
      });
    }

    // File share (single file)
    if (!shareLink.file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    await logDownload(shareLink, shareLink.file, req);

    const { downloadUrl, mimeType } = await resolveDownloadUrl(shareLink.file);
    return NextResponse.json({
      success: true,
      data: {
        downloadUrl,
        fileName: shareLink.file.originalName,
        mimeType,
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
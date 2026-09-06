import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPin } from '@/lib/pins';
import { getRateLimitKey, checkRateLimit, logPinAttempt } from '@/lib/rateLimit';
import { collectGeo, recordShareVisit } from '@/lib/trackLogin';

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

function getShareType(shareLink: any): 'url' | 'folder' | 'file' {
  if (shareLink.destinationUrl) return 'url';
  if (shareLink.folderId) return 'folder';
  return 'file';
}

// Gate 1-4 (no auth needed): exists, active, resource alive, expiry, limit.
// Returns { gate } where gate is null when all pass.
function checkGates(shareLink: any) {
  if (!shareLink) {
    return { gate: { code: 'not_found', error: 'Share link not found', status: 404 as const } };
  }
  if (!shareLink.isActive) {
    return { gate: { code: 'disabled', error: 'This link has been disabled by the owner', status: 410 as const } };
  }
  if (shareLink.file?.deletedAt || shareLink.folder?.deletedAt) {
    return { gate: { code: 'gone', error: 'The shared content is no longer available', status: 410 as const } };
  }
  if (shareLink.expiresAt && new Date(shareLink.expiresAt).getTime() <= Date.now()) {
    return {
      gate: {
        code: 'expired',
        error: 'This link has expired',
        status: 410 as const,
        expiresAt: shareLink.expiresAt.toISOString(),
      },
    };
  }
  if (shareLink.maxDownloads != null && shareLink.downloadCount >= shareLink.maxDownloads) {
    return { gate: { code: 'limit', error: 'This link has reached its maximum number of accesses', status: 410 as const } };
  }
  return { gate: null };
}

function remainingAccesses(shareLink: any): number | null {
  if (shareLink.maxDownloads == null) return null;
  return Math.max(0, shareLink.maxDownloads - shareLink.downloadCount);
}

// Gate 5: PIN verification (rate-limited). Returns { ok } — no counter touched.
async function verifySharePin(shareLink: any, pin: string | undefined, req: Request) {
  if (!shareLink.pinProtected) return { ok: true as const };

  if (!pin || pin.length !== 6) {
    return {
      ok: false as const,
      code: 'pin_required',
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
      ok: false as const,
      code: 'rate_limited',
      error: 'Too many failed attempts. Please try again later.',
      status: 429 as const,
    };
  }

  const isValid = await verifyPin(pin, shareLink.pinHash || '');

  await logPinAttempt(shareLink.id, ipAddress, isValid);

  if (!isValid) {
    return {
      ok: false as const,
      code: 'pin_invalid',
      error: 'Incorrect PIN. Please try again.',
      status: 401 as const,
      remaining,
    };
  }

  return { ok: true as const };
}

// Gate 7: atomic conditional increment. Only one winner per remaining slot,
// so concurrent requests can never exceed the limit.
async function recordAccess(shareLink: any): Promise<boolean> {
  if (shareLink.maxDownloads == null) {
    await prisma.shareLink.update({
      where: { id: shareLink.id },
      data: { downloadCount: { increment: 1 } },
    });
    return true;
  }
  const updated = await prisma.shareLink.updateMany({
    where: { id: shareLink.id, downloadCount: { lt: shareLink.maxDownloads } },
    data: { downloadCount: { increment: 1 } },
  });
  return updated.count === 1;
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
    const { gate } = checkGates(shareLink);

    if (gate || !shareLink) {
      return NextResponse.json(
        {
          success: false,
          error: gate?.error || 'Share link not found',
          code: gate?.code || 'not_found',
          ...(gate && 'expiresAt' in gate ? { expiresAt: (gate as any).expiresAt } : {}),
        },
        { status: gate?.status || 404 }
      );
    }

    const base = {
      pinProtected: shareLink.pinProtected,
      downloads: shareLink.downloadCount,
      maxDownloads: shareLink.maxDownloads,
      remaining: remainingAccesses(shareLink),
      expiresAt: shareLink.expiresAt?.toISOString() || null,
    };

    // URL shares: NEVER expose destinationUrl before authorization.
    if (getShareType(shareLink) === 'url') {
      let hostname = 'Shared link';
      try {
        hostname = new URL(shareLink.destinationUrl!).hostname;
      } catch {}
      return NextResponse.json({
        success: true,
        data: { ...base, type: 'url', hostname },
      });
    }

    if (shareLink.folderId && shareLink.folder) {
      const files = shareLink.folder.files
        .filter((f: any) => !f.deletedAt)
        .map((f) => ({
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
          ...base,
          type: 'folder',
          folderName: shareLink.folder.name,
          fileCount: files.length,
          totalSize: totalSize.toString(),
          files,
        },
      });
    }

    if (!shareLink.file) {
      return NextResponse.json(
        { success: false, error: 'File not found', code: 'gone' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...base,
        type: 'file',
        fileName: shareLink.file.originalName,
        fileSize: shareLink.file.size.toString(),
      },
    });
  } catch (error) {
    console.error('Get share info error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get share info', code: 'server_error' },
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

    // Gates 1-4 first: no counter touched for invalid/expired/limited links.
    const { gate } = checkGates(shareLink);
    if (gate || !shareLink) {
      if (shareLink) {
        await recordShareVisit({ shareLinkId: shareLink.id, success: false, code: gate?.code || 'not_found' });
      }
      return NextResponse.json(
        {
          success: false,
          error: gate?.error || 'Share link not found',
          code: gate?.code || 'not_found',
          ...(gate && 'expiresAt' in gate ? { expiresAt: (gate as any).expiresAt } : {}),
        },
        { status: gate?.status || 404 }
      );
    }

    // Collect visitor geo once per request (reused for the visit log).
    const visitorGeo = await collectGeo();
    const logVisit = (success: boolean, code?: string) =>
      recordShareVisit({ shareLinkId: shareLink.id, success, code, geo: visitorGeo });

    // Parse body ONCE (Request bodies are single-use).
    const body = await req.json().catch(() => ({}));
    const { pin, fileId, mode } = body;

    // Gate 5: PIN. Failed auth never increments the counter.
    const pinResult = await verifySharePin(shareLink, pin, req);
    if (!pinResult.ok) {
      await logVisit(false, (pinResult as any).code || 'pin_invalid');
      return NextResponse.json(
        {
          success: false,
          error: pinResult.error,
          code: (pinResult as any).code || 'pin_invalid',
          remaining: (pinResult as any).remaining,
        },
        { status: pinResult.status }
      );
    }

    // Gate 7: atomic access recording. Loser of a race gets limit error.
    const counted = await recordAccess(shareLink);
    if (!counted) {
      await logVisit(false, 'limit');
      return NextResponse.json(
        { success: false, error: 'This link has reached its maximum number of accesses', code: 'limit' },
        { status: 410 }
      );
    }

    const type = getShareType(shareLink);

    // URL share: authorized — reveal destination now.
    if (type === 'url') {
      await logVisit(true);
      return NextResponse.json({
        success: true,
        data: { redirectUrl: shareLink.destinationUrl },
      });
    }

    // Folder share ZIP download
    if (shareLink.folderId && mode === 'zip') {
      const files = (shareLink.folder?.files || []).filter((f: any) => !f.deletedAt);

      if (files.length === 0) {
        await logVisit(false, 'empty');
        return NextResponse.json(
          { success: false, error: 'Folder is empty', code: 'gone' },
          { status: 400 }
        );
      }

      for (const f of files) {
        await logDownload(shareLink, f, req);
      }

      try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
        const bucket = process.env.SUPABASE_BUCKET || 'cloudshare-files';

        if (!supabaseUrl || !supabaseServiceKey) {
          throw new Error('Supabase not configured');
        }

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
            { success: false, error: 'Could not load any files for download', code: 'server_error' },
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

        await logVisit(true);

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
          { success: false, error: 'Failed to create ZIP download', code: 'server_error' },
          { status: 500 }
        );
      }
    }

    // Folder share - specific file download
    if (shareLink.folderId) {
      const activeFiles = (shareLink.folder?.files || []).filter((f: any) => !f.deletedAt);
      let file = null;
      if (fileId) {
        file = activeFiles.find((f) => f.id === fileId) || null;
      } else {
        // Default to first file if none specified
        file = activeFiles[0] || null;
      }

      if (!file) {
        await logVisit(false, 'gone');
        return NextResponse.json(
          { success: false, error: 'File not found in folder', code: 'gone' },
          { status: 404 }
        );
      }

      await logDownload(shareLink, file, req);
      await logVisit(true);

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
      await logVisit(false, 'gone');
      return NextResponse.json(
        { success: false, error: 'File not found', code: 'gone' },
        { status: 404 }
      );
    }

    await logDownload(shareLink, shareLink.file, req);
    await logVisit(true);

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
      { success: false, error: 'Download failed', code: 'server_error' },
      { status: 500 }
    );
  }
}

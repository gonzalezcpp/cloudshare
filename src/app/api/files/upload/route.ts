import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const fileSize = file.size;
    const MAX_SIZE = 4 * 1024 * 1024; // 4MB limit for Vercel serverless

    if (fileSize > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 4MB. For larger files, Cloudflare R2 storage is required.' },
        { status: 400 }
      );
    }

    if (user.storageUsed + BigInt(fileSize) > user.storageLimit) {
      return NextResponse.json(
        { success: false, error: 'Storage limit exceeded' },
        { status: 400 }
      );
    }

    const fileId = uuidv4();
    const ext = file.name.split('.').pop() || '';
    const extPart = ext ? '.' + ext : '';
    const filename = fileId + extPart;
    const storagePath = session.user.id + '/' + filename;

    const buffer = Buffer.from(await file.arrayBuffer());

    const hasS3 = process.env.AWS_ACCESS_KEY_ID && process.env.S3_BUCKET_NAME;

    if (hasS3) {
      const { uploadToS3 } = await import('@/lib/s3');
      await uploadToS3(storagePath, buffer, file.type);
    }

    const dbFile = await prisma.file.create({
      data: {
        ownerId: session.user.id,
        filename: filename,
        originalName: file.name,
        storagePath: hasS3 ? storagePath : 'db:' + fileId,
        fileData: hasS3 ? null : buffer,
        size: fileSize,
        mimeType: file.type || 'application/octet-stream',
        folderId: folderId || null,
      },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        storageUsed: {
          increment: BigInt(fileSize),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: dbFile.id,
        filename: dbFile.filename,
        originalName: dbFile.originalName,
        size: Number(dbFile.size),
        mimeType: dbFile.mimeType,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    );
  }
}
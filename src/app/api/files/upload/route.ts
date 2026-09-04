import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { getPresignedUploadUrl, getPublicUrl } from '@/lib/s3';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { fileName, fileSize, fileType, folderId } = await req.json();

    if (!fileName || !fileSize) {
      return NextResponse.json(
        { success: false, error: 'Missing fileName or fileSize' },
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

    if (user.storageUsed + BigInt(fileSize) > user.storageLimit) {
      return NextResponse.json(
        { success: false, error: 'Storage limit exceeded' },
        { status: 400 }
      );
    }

    const hasR2 = process.env.AWS_ACCESS_KEY_ID && process.env.S3_BUCKET_NAME;

    if (!hasR2) {
      return NextResponse.json(
        { success: false, error: 'R2 storage not configured' },
        { status: 500 }
      );
    }

    const fileId = uuidv4();
    const ext = fileName.includes('.') ? fileName.split('.').pop() : '';
    const extPart = ext ? '.' + ext : '';
    const filename = fileId + extPart;
    const storagePath = session.user.id + '/' + filename;

    const uploadUrl = await getPresignedUploadUrl(storagePath, fileType || 'application/octet-stream', 600);

    const publicUrl = getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      data: {
        uploadUrl,
        storagePath,
        publicUrl,
        fileId,
        filename,
      },
    });
  } catch (error) {
    console.error('Get presigned URL error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get upload URL' },
      { status: 500 }
    );
  }
}

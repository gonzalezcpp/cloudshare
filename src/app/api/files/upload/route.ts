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

    const { getPlan } = await import('@/lib/plans');
    const { formatFileSize } = await import('@/lib/utils');
    const plan = getPlan((user as any).plan);

    if (Number(fileSize) > plan.maxFileSize) {
      return NextResponse.json(
        { success: false, error: `${plan.name} plan allows max ${formatFileSize(plan.maxFileSize)} per file. Upgrade for larger uploads.`, upgrade: true },
        { status: 400 }
      );
    }

    if (user.storageUsed + BigInt(fileSize) > user.storageLimit) {
      return NextResponse.json(
        { success: false, error: `Storage limit exceeded (${formatFileSize(Number(user.storageLimit))} on ${plan.name} plan). Upgrade or free up space.`, upgrade: true },
        { status: 400 }
      );
    }

    const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;

    if (!hasSupabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase storage not configured' },
        { status: 500 }
      );
    }

    const fileId = uuidv4();
    const ext = fileName.includes('.') ? fileName.split('.').pop() : '';
    const extPart = ext ? '.' + ext : '';
    const filename = fileId + extPart;
    const storagePath = session.user.id + '/' + filename;

    return NextResponse.json({
      success: true,
      data: {
        storagePath,
        filename,
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
        bucket: process.env.SUPABASE_BUCKET || 'cloudshare-files',
      },
    });
  } catch (error) {
    console.error('Get upload info error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get upload info' },
      { status: 500 }
    );
  }
}

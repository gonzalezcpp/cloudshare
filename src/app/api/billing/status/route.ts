import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getPlan, isStripeConfigured } from '@/lib/plans';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, storageUsed: true, storageLimit: true, subscriptionStatus: true },
    });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    const plan = getPlan(user.plan);
    return NextResponse.json({
      success: true,
      data: {
        plan: plan.id,
        planName: plan.name,
        storageUsed: Number(user.storageUsed),
        storageLimit: Number(user.storageLimit),
        maxFileSize: plan.maxFileSize,
        subscriptionStatus: user.subscriptionStatus,
        stripeConnected: isStripeConfigured(),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch billing status' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getStripe, getAppUrl } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ success: false, error: 'Stripe is not connected yet.' }, { status: 503 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.stripeCustomerId) {
      return NextResponse.json({ success: false, error: 'No billing account yet. Upgrade first.' }, { status: 400 });
    }

    const appUrl = getAppUrl(req);
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/settings`,
    });

    return NextResponse.json({ success: true, data: { url: portal.url } });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json({ success: false, error: 'Failed to open billing portal' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getStripe, getAppUrl } from '@/lib/stripe';
import { getPriceId, type PlanId } from '@/lib/plans';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await req.json();
    if (plan !== 'pro' && plan !== 'business') {
      return NextResponse.json({ success: false, error: 'Invalid plan' }, { status: 400 });
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { success: false, demo: true, error: 'Stripe is not connected yet. Add STRIPE_SECRET_KEY + price IDs to enable checkout.' },
        { status: 503 }
      );
    }

    const priceId = getPriceId(plan as PlanId);
    if (!priceId) {
      return NextResponse.json(
        { success: false, demo: true, error: `No Stripe price configured for ${plan}. Set STRIPE_${plan.toUpperCase()}_PRICE_ID.` },
        { status: 503 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.username,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    const appUrl = getAppUrl(req);
    const checkout = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings?upgraded=1`,
      cancel_url: `${appUrl}/pricing?cancelled=1`,
      metadata: { userId: user.id, plan },
      subscription_data: { metadata: { userId: user.id, plan } },
    });

    return NextResponse.json({ success: true, data: { url: checkout.url } });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ success: false, error: 'Failed to start checkout' }, { status: 500 });
  }
}

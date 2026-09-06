import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';
import { PLANS } from '@/lib/plans';

async function applySubscription(opts: {
  userId?: string;
  customerId?: string;
  subscriptionId?: string;
  status?: string;
  plan?: string;
}) {
  let user = null;
  if (opts.userId) {
    user = await prisma.user.findUnique({ where: { id: opts.userId } });
  }
  if (!user && opts.customerId) {
    user = await prisma.user.findFirst({ where: { stripeCustomerId: opts.customerId } });
  }
  if (!user) return;

  const active = opts.status === 'active' || opts.status === 'trialing';
  const plan = opts.plan === 'business' ? 'business' : opts.plan === 'pro' ? 'pro' : active ? user.plan : 'free';
  const finalPlan = active ? plan : 'free';

  const previousPlan = user.plan;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: finalPlan,
      storageLimit: PLANS[finalPlan as 'free' | 'pro' | 'business'].storageLimit,
      stripeSubscriptionId: opts.subscriptionId || user.stripeSubscriptionId,
      subscriptionStatus: opts.status || user.subscriptionStatus,
    },
  });
  if (previousPlan !== finalPlan) {
    const { logActivity } = await import('@/lib/activity');
    await logActivity({
      userId: user.id,
      eventType: 'plan_changed',
      metadata: { from: previousPlan, to: finalPlan },
    });
  }
}

export async function POST(req: Request) {
  try {
    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ received: true });

    const sig = req.headers.get('stripe-signature');
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ success: false, error: 'Missing webhook signature' }, { status: 400 });
    }

    const rawBody = await req.text();
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('Webhook signature failed:', err.message);
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as any;
        await applySubscription({
          userId: s.metadata?.userId || s.subscription_data?.metadata?.userId,
          customerId: typeof s.customer === 'string' ? s.customer : s.customer?.id,
          subscriptionId: typeof s.subscription === 'string' ? s.subscription : s.subscription?.id,
          status: 'active',
          plan: s.metadata?.plan,
        });
        // ensure customer id saved
        if (s.customer && s.metadata?.userId) {
          await prisma.user.update({
            where: { id: s.metadata.userId },
            data: { stripeCustomerId: typeof s.customer === 'string' ? s.customer : s.customer.id },
          }).catch(() => {});
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as any;
        await applySubscription({
          userId: sub.metadata?.userId,
          customerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
          subscriptionId: sub.id,
          status: sub.status,
          plan: sub.metadata?.plan,
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;
        await applySubscription({
          userId: sub.metadata?.userId,
          customerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
          subscriptionId: sub.id,
          status: 'canceled',
          plan: 'free',
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ success: false, error: 'Webhook failed' }, { status: 500 });
  }
}

export type PlanId = 'free' | 'pro' | 'business';

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthly: number;
  storageLimit: bigint;
  maxFileSize: number;
  maxShares: number | null;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

const GB = 1073741824;

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    storageLimit: BigInt(10 * GB),
    maxFileSize: 500 * 1024 * 1024,
    maxShares: 50,
    features: [
      '10 GB storage',
      '500 MB max file size',
      '50 share links',
      'PIN-protected sharing',
      'QR codes',
      '7-day link expiry',
    ],
    cta: 'Current plan',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 9,
    storageLimit: BigInt(1024 * GB),
    maxFileSize: 10 * GB,
    maxShares: null,
    features: [
      '1 TB storage',
      '10 GB max file size',
      'Unlimited share links',
      'PIN-protected sharing',
      'QR codes',
      'Custom expiry & download limits',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    highlighted: true,
  },
  business: {
    id: 'business',
    name: 'Business',
    priceMonthly: 29,
    storageLimit: BigInt(5 * 1024 * GB),
    maxFileSize: 50 * GB,
    maxShares: null,
    features: [
      '5 TB storage',
      '50 GB max file size',
      'Everything in Pro',
      'Team workspaces (coming soon)',
      'Advanced analytics',
      'Dedicated support',
    ],
    cta: 'Upgrade to Business',
  },
};

export function getPlan(id?: string | null): Plan {
  if (id === 'pro' || id === 'business') return PLANS[id];
  return PLANS.free;
}

export function getPriceId(plan: PlanId): string | null {
  if (plan === 'pro') return process.env.STRIPE_PRO_PRICE_ID || null;
  if (plan === 'business') return process.env.STRIPE_BUSINESS_PRICE_ID || null;
  return null;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Crown, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { BrandLogo } from '@/components/BrandLogo';
import { PLANS, type PlanId } from '@/lib/plans';

export default function PricingPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const [currentPlan, setCurrentPlan] = useState<PlanId>('free');
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);

  useEffect(() => {
    if (params.get('cancelled')) toast.error('Checkout cancelled');
    if (status === 'authenticated') {
      fetch('/api/billing/status')
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setCurrentPlan(d.data.plan);
        })
        .catch(() => {});
    }
  }, [status, params]);

  const handleUpgrade = async (plan: PlanId) => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (plan === 'free' || plan === currentPlan) return;
    setLoadingPlan(plan);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        window.location.href = data.data.url;
      } else if (data.demo) {
        toast.error('Stripe not connected yet — see setup instructions below', { duration: 5000 });
        document.getElementById('stripe-setup')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        toast.error(data.error || 'Failed to start checkout');
      }
    } catch {
      toast.error('Failed to start checkout');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/"><BrandLogo size="md" /></Link>
          <div className="flex items-center gap-2">
            {status === 'authenticated' ? (
              <Link href="/dashboard" className="px-4 py-2 text-sm font-semibold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-600">Sign in</Link>
                <Link href="/signup" className="px-4 py-2 text-sm font-semibold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-14 max-w-5xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#7c3aed]/10 text-[#7c3aed] text-xs font-semibold rounded-full mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Simple, honest pricing
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0f172a]">Upgrade your CloudShare</h1>
          <p className="text-gray-500 mt-2">Start free. Upgrade when you need more space.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {(Object.values(PLANS) as typeof PLANS[PlanId][]).map((plan) => {
            const isCurrent = plan.id === currentPlan;
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl border p-6 flex flex-col ${
                  plan.highlighted ? 'border-[#2563eb] shadow-lg shadow-[#2563eb]/10 md:-my-3 md:py-9' : 'border-gray-200 shadow-sm'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#2563eb] text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <Crown className="h-3 w-3" /> MOST POPULAR
                  </span>
                )}
                <h2 className="text-lg font-bold text-[#0f172a]">{plan.name}</h2>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-4xl font-bold text-[#0f172a]">${plan.priceMonthly}</span>
                  <span className="text-sm text-gray-400 mb-1">/month</span>
                </div>
                <ul className="mt-5 space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent || loadingPlan !== null}
                  className={`mt-6 w-full py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    isCurrent
                      ? 'bg-green-50 text-green-700 cursor-default'
                      : plan.highlighted
                        ? 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {loadingPlan === plan.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isCurrent ? '✓ Current plan' : plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        <div id="stripe-setup" className="mt-10 bg-white rounded-2xl border border-dashed border-gray-300 p-6">
          <h3 className="font-semibold text-[#0f172a] mb-2">⚙️ Connect Stripe to accept payments (owner setup)</h3>
          <ol className="text-sm text-gray-600 space-y-1.5 list-decimal list-inside">
            <li>Create a Stripe account at stripe.com, then create 2 recurring Products: <b>Pro $9/mo</b> and <b>Business $29/mo</b></li>
            <li>Copy the Price IDs (start with <code className="bg-gray-100 px-1 rounded">price_...</code>)</li>
            <li>In Vercel → your project → Settings → Environment Variables, add:
              <ul className="list-disc list-inside ml-4 mt-1 font-mono text-xs bg-gray-50 rounded-lg p-3">
                <li>STRIPE_SECRET_KEY = sk_live_... (or sk_test_... for testing)</li>
                <li>STRIPE_PRO_PRICE_ID = price_...</li>
                <li>STRIPE_BUSINESS_PRICE_ID = price_...</li>
                <li>STRIPE_WEBHOOK_SECRET = whsec_... (from Stripe → Developers → Webhooks → endpoint: https://your-app.vercel.app/api/billing/webhook, events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted)</li>
                <li>NEXT_PUBLIC_APP_URL = https://your-app.vercel.app</li>
              </ul>
            </li>
            <li>Redeploy. Until then, upgrade buttons show this notice (demo mode).</li>
          </ol>
        </div>
      </main>
    </div>
  );
}

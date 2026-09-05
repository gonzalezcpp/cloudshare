'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { User, Lock, Save, Crown, CreditCard, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatFileSize } from '@/lib/utils';

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [username, setUsername] = useState(session?.user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [billing, setBilling] = useState<any>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [isGoogleOnly, setIsGoogleOnly] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    fetch('/api/billing/status')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setBilling(d.data);
      })
      .catch(() => {});
    fetch('/api/user/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setIsGoogleOnly(d.data.authProvider === 'google');
      })
      .catch(() => {});
    if (typeof window !== 'undefined' && window.location.search.includes('upgraded=1')) {
      toast.success('Welcome to Pro! Your plan is now active.');
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  useEffect(() => {
    if (session?.user?.name) setUsername(session.user.name);
  }, [session?.user?.name]);

  const handleManageBilling = async () => {
    setBillingLoading(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data?.url) {
        window.location.href = data.data.url;
      } else {
        toast.error(data.error || 'Failed to open billing portal');
      }
    } catch {
      toast.error('Failed to open billing portal');
    } finally {
      setBillingLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Profile updated');
        update();
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (!isGoogleOnly && !currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    setOtpSending(true);
    try {
      const res = await fetch('/api/user/password/request', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setOtp('');
        startResendTimer();
        toast.success(`OTP sent to ${session?.user?.email}`);
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch {
      toast.error('Failed to send OTP');
    } finally {
      setOtpSending(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.replace(/\D/g, '').length !== 6) {
      toast.error('Please enter the 6-digit OTP from your email');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, otp: otp.replace(/\D/g, '') }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Password changed');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setOtp('');
        setOtpSent(false);
        fetch('/api/user/me')
          .then((r) => r.json())
          .then((d) => {
            if (d.success) setIsGoogleOnly(d.data.authProvider === 'google');
          })
          .catch(() => {});
      } else {
        toast.error(data.error || 'Failed to change password');
      }
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a]">
          Settings
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Manage your account settings
        </p>
      </div>

      <div className="bg-gradient-to-r from-[#2563eb] to-[#7c3aed] rounded-xl p-6 shadow-sm text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {billing ? `${billing.planName} plan` : 'Your plan'}
              </h2>
              <p className="text-sm text-white/70">
                {billing
                  ? `${formatFileSize(billing.storageUsed)} of ${formatFileSize(billing.storageLimit)} used`
                  : 'Loading usage...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {billing && billing.plan !== 'free' ? (
              <button
                onClick={handleManageBilling}
                disabled={billingLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white text-[#2563eb] text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                {billingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Manage billing
              </button>
            ) : (
              <Link
                href="/pricing"
                className="flex items-center gap-2 px-4 py-2 bg-white text-[#2563eb] text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Crown className="h-4 w-4" />
                Upgrade
              </Link>
            )}
          </div>
        </div>
        {billing && (
          <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${Math.min((billing.storageUsed / Math.max(billing.storageLimit, 1)) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-[#2563eb]/10 rounded-lg flex items-center justify-center">
            <User className="h-4 w-4 text-[#2563eb]" />
          </div>
          <h2 className="text-lg font-semibold text-[#0f172a]">
            Profile
          </h2>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={session?.user?.email || ''}
              disabled
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed text-sm"
            />
            <p className="mt-1 text-xs text-gray-400">
              Email cannot be changed
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || username === session?.user?.name}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-[#7c3aed]/10 rounded-lg flex items-center justify-center">
            <Lock className="h-4 w-4 text-[#7c3aed]" />
          </div>
          <h2 className="text-lg font-semibold text-[#0f172a]">
            Change Password
          </h2>
        </div>

        <p className="-mt-2 mb-4 text-xs text-gray-400">
          For security, we email a 6-digit OTP to <span className="font-medium text-gray-600">{session?.user?.email}</span> to confirm the change.
        </p>

        <form onSubmit={handleChangePassword} className="space-y-4">
          {!isGoogleOnly && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent bg-white"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent bg-white"
            />
            <p className="mt-1 text-xs text-gray-400">
              Must be at least 8 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent bg-white"
            />
          </div>

          {!otpSent ? (
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={otpSending}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Lock className="h-4 w-4" />
              {otpSending ? 'Sending OTP...' : 'Send OTP to my email'}
            </button>
          ) : (
            <>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-700">
                  OTP sent to <span className="font-semibold">{session?.user?.email}</span>. It expires in 10 minutes.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email OTP
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  placeholder="------"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-center font-mono text-lg tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <Lock className="h-4 w-4" />
                  {loading ? 'Verifying...' : 'Verify OTP & Change Password'}
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpSending || resendTimer > 0}
                  className="px-4 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {resendTimer > 0 ? `Resend (${resendTimer}s)` : 'Resend'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

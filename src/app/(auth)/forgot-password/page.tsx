'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { BrandLogo } from '@/components/BrandLogo';

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getPasswordStrength(password: string) {
  let score = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  Object.values(checks).forEach((v) => { if (v) score++; });
  let label = '', color = '';
  if (score <= 2) { label = 'Weak'; color = 'bg-red-500'; }
  else if (score <= 3) { label = 'Fair'; color = 'bg-amber-500'; }
  else if (score <= 4) { label = 'Good'; color = 'bg-blue-500'; }
  else { label = 'Strong'; color = 'bg-green-500'; }
  return { score, label, color, checks };
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const strength = getPasswordStrength(newPassword);

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

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/auth/forgot-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('reset');
        setOtp('');
        startResendTimer();
        toast.success('If an account exists, an OTP has been sent to your email');
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch {
      toast.error('Failed to send OTP');
    } finally {
      setSending(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.replace(/\D/g, '').length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }
    if (strength.score < 5) {
      toast.error('Password must meet all requirements below');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setResetting(true);
    try {
      const res = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otp.replace(/\D/g, ''), newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password reset! Please sign in with your new password.');
        router.push('/login');
      } else {
        toast.error(data.error || 'Failed to reset password');
      }
    } catch {
      toast.error('Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex mb-6">
            <BrandLogo size="lg" />
          </Link>
          <h1 className="text-2xl font-bold text-[#0f172a]">
            {step === 'email' ? 'Forgot password?' : 'Reset password'}
          </h1>
          <p className="text-gray-500 mt-1.5 text-sm">
            {step === 'email'
              ? 'Enter your account email and we’ll send you an OTP.'
              : `Enter the OTP sent to ${email} and choose a new password.`}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError(validateEmail(e.target.value) || !e.target.value ? '' : 'Please enter a valid email address');
                    }}
                    required
                    className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] bg-white ${emailError ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="you@example.com"
                  />
                </div>
                {emailError && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {emailError}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={sending || !validateEmail(email)}
                className="w-full py-2.5 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {sending ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-3.5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">OTP from email</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  placeholder="------"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-center font-mono text-lg tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-[#2563eb] bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={sending || resendTimer > 0}
                  className="mt-1.5 text-xs text-[#2563eb] font-medium hover:underline disabled:text-gray-400 disabled:no-underline"
                >
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] bg-white"
                    placeholder="Min 8 chars, upper, lower, number, symbol"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                  </button>
                </div>
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength.score ? strength.color : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">{strength.label}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm new password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] bg-white"
                  placeholder="Repeat new password"
                />
              </div>
              <button
                type="submit"
                disabled={resetting}
                className="w-full py-2.5 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {resetting ? 'Resetting...' : 'Reset password'}
              </button>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full text-xs text-gray-500 hover:text-gray-700"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-[#2563eb] font-semibold hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

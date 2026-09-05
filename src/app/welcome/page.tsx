'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Lock, Eye, EyeOff, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { BrandLogo } from '@/components/BrandLogo';

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

export default function WelcomePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [setPasswordEnabled, setSetPasswordEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const strength = getPasswordStrength(password);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/user/me')
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            if (!data.data.needsOnboarding) {
              router.push('/dashboard');
              return;
            }
            setUsername(data.data.username || '');
          }
        })
        .finally(() => setInitialLoading(false));
    }
  }, [status, router]);

  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/user/check-username?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        setUsernameStatus(data?.data?.available ? 'ok' : 'taken');
      } catch {
        setUsernameStatus('idle');
      }
    }, 500);
    return () => clearTimeout(t);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    if (/[^a-zA-Z0-9_]/.test(username)) {
      toast.error('Username can only contain letters, numbers, underscores');
      return;
    }
    if (usernameStatus === 'taken') {
      toast.error('Username already taken');
      return;
    }
    if (setPasswordEnabled) {
      if (!password) {
        toast.error('Please create a password or turn off password setup');
        return;
      }
      if (strength.score < 5) {
        toast.error('Password must meet all requirements');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: setPasswordEnabled ? password : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Welcome to CloudShare!');
        await update();
        router.push('/dashboard');
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || initialLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-8">
          <div className="inline-flex mb-6"><BrandLogo size="lg" /></div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Welcome to CloudShare 🎉</h1>
          <p className="text-gray-500 mt-1.5 text-sm">
            You signed in with Google{(session?.user?.email ? ` as ${(session.user as any).email}` : '')}. Pick a username and create a password so you can also sign in with email.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Choose a username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] bg-white"
                  placeholder="e.g. john_doe"
                  minLength={3}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                  {usernameStatus === 'ok' && <Check className="h-4 w-4 text-green-500" />}
                  {usernameStatus === 'taken' && <span className="text-xs text-red-500 font-medium">Taken</span>}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400">Letters, numbers, underscores only. Min 3 characters.</p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-medium text-gray-700">Create a password</span>
              <button
                type="button"
                onClick={() => setSetPasswordEnabled(!setPasswordEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${setPasswordEnabled ? 'bg-[#2563eb]' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${setPasswordEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {setPasswordEnabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] bg-white"
                      placeholder="Min 8 chars, upper, lower, number, symbol"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                      {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength.score ? strength.color : 'bg-gray-200'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">{strength.label}</p>
                      <div className="mt-1 space-y-0.5">
                        {[
                          ['8+ characters', strength.checks.length],
                          ['Uppercase letter', strength.checks.uppercase],
                          ['Lowercase letter', strength.checks.lowercase],
                          ['Number', strength.checks.number],
                          ['Special character', strength.checks.special],
                        ].map(([label, ok]) => (
                          <p key={label as string} className={`text-xs ${ok ? 'text-green-600' : 'text-gray-400'}`}>
                            {ok ? '✓' : '○'} {label}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] bg-white"
                    placeholder="Repeat password"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Saving...' : 'Complete setup →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

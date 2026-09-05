'use client';

import { useState } from 'react';
import { Shield, ShieldOff, Eye, EyeOff, CalendarClock, Users } from 'lucide-react';

export interface ShareSettings {
  pinProtected: boolean;
  pin: string;
  showPin: boolean;
  expiryMode: 'never' | 'custom';
  expiryDate: string;
  expiryTime: string;
  limitMode: 'unlimited' | 'limited';
  accessLimit: string;
}

export function useShareSettings(): [ShareSettings, React.Dispatch<React.SetStateAction<ShareSettings>>] {
  const [settings, setSettings] = useState<ShareSettings>({
    pinProtected: false,
    pin: '',
    showPin: false,
    expiryMode: 'never',
    expiryDate: '',
    expiryTime: '',
    limitMode: 'unlimited',
    accessLimit: '10',
  });
  return [settings, setSettings];
}

function toISO(date: string, time: string): string | undefined {
  if (!date) return undefined;
  const t = time || '23:59';
  const d = new Date(`${date}T${t}`);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function buildSharePayload(settings: ShareSettings) {
  return {
    pinProtected: settings.pinProtected,
    pin: settings.pinProtected ? settings.pin : undefined,
    expiresAt: settings.expiryMode === 'custom' ? toISO(settings.expiryDate, settings.expiryTime) : undefined,
    maxDownloads: settings.limitMode === 'limited' ? Number(settings.accessLimit) : undefined,
  };
}

export function validateShareSettings(settings: ShareSettings): string | null {
  if (settings.pinProtected && settings.pin.length !== 6) {
    return 'PIN must be exactly 6 characters';
  }
  if (settings.expiryMode === 'custom') {
    if (!settings.expiryDate) return 'Please pick an expiration date';
    const iso = toISO(settings.expiryDate, settings.expiryTime);
    if (!iso) return 'Invalid expiration date';
    if (new Date(iso).getTime() <= Date.now()) return 'Expiration must be in the future';
  }
  if (settings.limitMode === 'limited') {
    const n = Number(settings.accessLimit);
    if (!Number.isInteger(n) || n < 1 || n > 1000000) {
      return 'Access limit must be a whole number between 1 and 1,000,000';
    }
  }
  return null;
}

export function resetShareSettings(): ShareSettings {
  return {
    pinProtected: false,
    pin: '',
    showPin: false,
    expiryMode: 'never',
    expiryDate: '',
    expiryTime: '',
    limitMode: 'unlimited',
    accessLimit: '10',
  };
}

export function ShareSettingsFields({
  settings,
  setSettings,
}: {
  settings: ShareSettings;
  setSettings: React.Dispatch<React.SetStateAction<ShareSettings>>;
}) {
  const set = (patch: Partial<ShareSettings>) =>
    setSettings((s) => ({ ...s, ...patch }));

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-5">
      {/* Security */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {settings.pinProtected ? (
              <Shield className="h-5 w-5 text-[#2563eb]" />
            ) : (
              <ShieldOff className="h-5 w-5 text-gray-400" />
            )}
            <span className="text-sm font-medium text-gray-700">
              Protect with PIN
            </span>
          </div>
          <button
            type="button"
            onClick={() => set({ pinProtected: !settings.pinProtected })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.pinProtected ? 'bg-[#2563eb]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.pinProtected ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {settings.pinProtected && (
          <div className="mt-3">
            <div className="relative">
              <input
                type={settings.showPin ? 'text' : 'password'}
                value={settings.pin}
                onChange={(e) => set({ pin: e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6) })}
                maxLength={6}
                className="w-full px-4 py-2.5 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent bg-white text-[#0f172a] font-mono text-center text-lg tracking-widest"
                placeholder="------"
              />
              <button
                type="button"
                onClick={() => set({ showPin: !settings.showPin })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {settings.showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              6 characters, letters and numbers only
            </p>
          </div>
        )}
      </div>

      {/* Expiration */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <CalendarClock className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Link expiration</span>
        </div>
        <div className="flex gap-2">
          {(['never', 'custom'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => set({ expiryMode: mode })}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                settings.expiryMode === mode
                  ? 'border-[#2563eb] bg-[#2563eb]/5 text-[#2563eb]'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {mode === 'never' ? 'Never expires' : 'Set expiration'}
            </button>
          ))}
        </div>
        {settings.expiryMode === 'custom' && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <input
              type="date"
              value={settings.expiryDate}
              min={today}
              onChange={(e) => set({ expiryDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-[#0f172a] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
            />
            <input
              type="time"
              value={settings.expiryTime}
              onChange={(e) => set({ expiryTime: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-[#0f172a] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Access limit */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Maximum accesses</span>
        </div>
        <div className="flex gap-2">
          {(['unlimited', 'limited'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => set({ limitMode: mode })}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                settings.limitMode === mode
                  ? 'border-[#2563eb] bg-[#2563eb]/5 text-[#2563eb]'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {mode === 'unlimited' ? 'Unlimited' : 'Limited'}
            </button>
          ))}
        </div>
        {settings.limitMode === 'limited' && (
          <input
            type="number"
            min={1}
            max={1000000}
            value={settings.accessLimit}
            onChange={(e) => set({ accessLimit: e.target.value })}
            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-[#0f172a] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
            placeholder="e.g. 10"
          />
        )}
      </div>
    </div>
  );
}

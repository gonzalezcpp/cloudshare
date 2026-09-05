'use client';

import { useState } from 'react';
import { X, Copy, Check, Shield, Trash2, Power, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

interface ManageShareDialogProps {
  link: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function ManageShareDialog({ link, isOpen, onClose, onUpdated }: ManageShareDialogProps) {
  const [pinProtected, setPinProtected] = useState(link.pinProtected);
  const [pin, setPin] = useState('');
  const [pinTouched, setPinTouched] = useState(false);
  const [expiryMode, setExpiryMode] = useState<'never' | 'custom'>(link.expiresAt ? 'custom' : 'never');
  const [expiryDate, setExpiryDate] = useState(
    link.expiresAt ? new Date(link.expiresAt).toISOString().split('T')[0] : ''
  );
  const [expiryTime, setExpiryTime] = useState(
    link.expiresAt
      ? new Date(link.expiresAt).toISOString().slice(11, 16)
      : ''
  );
  const [limitMode, setLimitMode] = useState<'unlimited' | 'limited'>(link.maxDownloads != null ? 'limited' : 'unlimited');
  const [accessLimit, setAccessLimit] = useState(String(link.maxDownloads ?? '10'));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/d/${link.shareToken}`;
  const remaining = link.maxDownloads != null ? Math.max(0, link.maxDownloads - link.downloadCount) : null;
  const today = new Date().toISOString().split('T')[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (pinProtected && pinTouched) {
      if (pin.length !== 6) {
        toast.error('New PIN must be exactly 6 characters (or turn protection off)');
        return;
      }
    }
    let expiresAt: string | null | undefined = undefined;
    if (expiryMode === 'never') {
      expiresAt = link.expiresAt ? null : undefined;
    } else {
      if (!expiryDate) {
        toast.error('Please pick an expiration date');
        return;
      }
      const d = new Date(`${expiryDate}T${expiryTime || '23:59'}`);
      if (isNaN(d.getTime()) || d.getTime() <= Date.now()) {
        toast.error('Expiration must be in the future');
        return;
      }
      expiresAt = d.toISOString();
    }

    let maxDownloads: number | null | undefined = undefined;
    if (limitMode === 'unlimited') {
      maxDownloads = link.maxDownloads != null ? null : undefined;
    } else {
      const n = Number(accessLimit);
      if (!Number.isInteger(n) || n < 1 || n > 1000000) {
        toast.error('Access limit must be a whole number between 1 and 1,000,000');
        return;
      }
      if (n !== link.maxDownloads) maxDownloads = n;
    }

    const payload: any = {};
    if (pinProtected !== link.pinProtected) {
      payload.pinProtected = pinProtected;
      if (pinProtected) {
        if (!pinTouched || pin.length !== 6) {
          toast.error('Enter a new 6-character PIN to enable protection');
          return;
        }
        payload.pin = pin;
      }
    } else if (pinProtected && pinTouched && pin.length === 6) {
      payload.pinProtected = true;
      payload.pin = pin;
    }
    if (expiresAt !== undefined) payload.expiresAt = expiresAt;
    if (maxDownloads !== undefined) payload.maxDownloads = maxDownloads;

    if (Object.keys(payload).length === 0) {
      toast.success('No changes to save');
      onClose();
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/share/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Share settings updated');
        onUpdated();
        onClose();
      } else {
        toast.error(data.error || 'Failed to update');
      }
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      const res = await fetch(`/api/share/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !link.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(link.isActive ? 'Link disabled' : 'Link re-enabled');
        onUpdated();
        onClose();
      } else {
        toast.error(data.error || 'Failed');
      }
    } catch {
      toast.error('Failed');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this share link permanently?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/share/${link.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Share link deleted');
        onUpdated();
        onClose();
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-semibold text-[#0f172a]">Manage Share</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-[#0f172a]">{link.downloadCount}</p>
              <p className="text-xs text-gray-400">Accessed</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-[#0f172a]">
                {remaining == null ? '∞' : remaining}
              </p>
              <p className="text-xs text-gray-400">Remaining</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-[#0f172a]">
                {link.maxDownloads == null ? '∞' : link.maxDownloads}
              </p>
              <p className="text-xs text-gray-400">Limit</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 -mt-3">
            Created {formatDate(link.createdAt)}
            {link.expiresAt ? ` • Expires ${formatDate(link.expiresAt)}` : ' • Never expires'}
          </p>

          {/* Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Share link</label>
            <div className="flex gap-2">
              <input type="text" value={shareUrl} readOnly className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm" />
              <button onClick={handleCopy} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-600" />}
              </button>
            </div>
          </div>

          {/* PIN */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-400" /> PIN protection
              </span>
              <button
                type="button"
                onClick={() => { setPinProtected(!pinProtected); setPinTouched(true); }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pinProtected ? 'bg-[#2563eb]' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pinProtected ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {pinProtected && (
              <input
                type="text"
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6)); setPinTouched(true); }}
                maxLength={6}
                placeholder={link.pinProtected ? 'Enter new PIN to change' : 'New 6-character PIN'}
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg bg-white font-mono text-center tracking-widest text-sm focus:ring-2 focus:ring-[#2563eb]"
              />
            )}
            {!pinProtected && link.pinProtected && (
              <p className="mt-1 text-xs text-amber-600">Protection will be removed on save.</p>
            )}
          </div>

          {/* Expiration */}
          <div>
            <span className="text-sm font-medium text-gray-700">Expiration</span>
            <div className="flex gap-2 mt-2">
              {(['never', 'custom'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setExpiryMode(m)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${expiryMode === m ? 'border-[#2563eb] bg-[#2563eb]/5 text-[#2563eb]' : 'border-gray-200 text-gray-500'}`}
                >
                  {m === 'never' ? 'Never' : 'Custom'}
                </button>
              ))}
            </div>
            {expiryMode === 'custom' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input type="date" value={expiryDate} min={today} onChange={(e) => setExpiryDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" />
                <input type="time" value={expiryTime} onChange={(e) => setExpiryTime(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" />
              </div>
            )}
          </div>

          {/* Limit */}
          <div>
            <span className="text-sm font-medium text-gray-700">Access limit</span>
            <div className="flex gap-2 mt-2">
              {(['unlimited', 'limited'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setLimitMode(m)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${limitMode === m ? 'border-[#2563eb] bg-[#2563eb]/5 text-[#2563eb]' : 'border-gray-200 text-gray-500'}`}
                >
                  {m === 'unlimited' ? 'Unlimited' : 'Limited'}
                </button>
              ))}
            </div>
            {limitMode === 'limited' && (
              <input
                type="number"
                min={link.downloadCount}
                max={1000000}
                value={accessLimit}
                onChange={(e) => setAccessLimit(e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              />
            )}
          </div>

          {/* Danger zone */}
          <div className="border border-gray-200 rounded-xl p-3 space-y-2">
            <button
              onClick={handleToggleActive}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg"
            >
              <Power className="h-4 w-4" />
              {link.isActive ? 'Disable link' : 'Re-enable link'}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? 'Deleting...' : 'Delete share'}
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import {
  Upload, Download, Trash2, RotateCcw, XCircle, Share2, Pencil,
  LogIn, UserPlus, KeyRound, Crown, FolderPlus, FileEdit,
  FolderInput, Link2, ShieldAlert, Ban, Activity as ActivityIcon,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const EVENT_META: Record<string, { icon: any; bg: string; color: string; label: (name?: string | null) => string }> = {
  signup: { icon: UserPlus, bg: 'bg-green-50', color: 'text-green-600', label: () => 'Account created' },
  login: { icon: LogIn, bg: 'bg-blue-50', color: 'text-blue-600', label: () => 'Signed in' },
  login_failed: { icon: ShieldAlert, bg: 'bg-red-50', color: 'text-red-500', label: () => 'Failed sign-in attempt' },
  file_upload: { icon: Upload, bg: 'bg-[#2563eb]/10', color: 'text-[#2563eb]', label: (n) => `Uploaded ${n || 'a file'}` },
  file_download: { icon: Download, bg: 'bg-[#2563eb]/10', color: 'text-[#2563eb]', label: (n) => `Downloaded ${n || 'a file'}` },
  file_rename: { icon: FileEdit, bg: 'bg-gray-100', color: 'text-gray-500', label: (n) => `Renamed to ${n || 'new name'}` },
  file_move: { icon: FolderInput, bg: 'bg-gray-100', color: 'text-gray-500', label: (n) => `Moved ${n || 'a file'}` },
  file_trash: { icon: Trash2, bg: 'bg-amber-50', color: 'text-amber-600', label: (n) => `Moved ${n || 'a file'} to trash` },
  file_restore: { icon: RotateCcw, bg: 'bg-green-50', color: 'text-green-600', label: (n) => `Restored ${n || 'a file'}` },
  file_delete: { icon: XCircle, bg: 'bg-red-50', color: 'text-red-500', label: (n) => `Permanently deleted ${n || 'a file'}` },
  folder_created: { icon: FolderPlus, bg: 'bg-[#7c3aed]/10', color: 'text-[#7c3aed]', label: (n) => `Created folder ${n || ''}` },
  folder_trash: { icon: Trash2, bg: 'bg-amber-50', color: 'text-amber-600', label: (n) => `Moved folder ${n || ''} to trash` },
  folder_restore: { icon: RotateCcw, bg: 'bg-green-50', color: 'text-green-600', label: (n) => `Restored folder ${n || ''}` },
  folder_delete: { icon: XCircle, bg: 'bg-red-50', color: 'text-red-500', label: (n) => `Deleted folder ${n || ''}` },
  trash_emptied: { icon: Trash2, bg: 'bg-red-50', color: 'text-red-500', label: () => 'Emptied trash' },
  share_created: { icon: Share2, bg: 'bg-[#2563eb]/10', color: 'text-[#2563eb]', label: (n) => `Shared ${n || 'a link'}` },
  share_opened: { icon: Link2, bg: 'bg-[#10b981]/10', color: 'text-[#10b981]', label: (n) => `Someone opened ${n || 'your link'}` },
  share_pin_failed: { icon: ShieldAlert, bg: 'bg-amber-50', color: 'text-amber-600', label: (n) => `Wrong PIN on ${n || 'your link'}` },
  share_blocked: { icon: Ban, bg: 'bg-red-50', color: 'text-red-500', label: (n) => `Blocked access to ${n || 'your link'}` },
  share_updated: { icon: Pencil, bg: 'bg-gray-100', color: 'text-gray-500', label: () => 'Updated share settings' },
  share_disabled: { icon: Ban, bg: 'bg-gray-100', color: 'text-gray-500', label: () => 'Disabled a share link' },
  share_deleted: { icon: XCircle, bg: 'bg-red-50', color: 'text-red-500', label: () => 'Deleted a share link' },
  password_changed: { icon: KeyRound, bg: 'bg-gray-100', color: 'text-gray-500', label: () => 'Changed password' },
  password_reset: { icon: KeyRound, bg: 'bg-gray-100', color: 'text-gray-500', label: () => 'Reset password' },
  plan_changed: { icon: Crown, bg: 'bg-[#f59e0b]/10', color: 'text-[#f59e0b]', label: () => 'Changed plan' },
};

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function ActivityPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState<string | null>(null);

  const fetchPage = async (before: string | null, append: boolean) => {
    try {
      const params = new URLSearchParams({ take: '50' });
      if (before) params.set('before', before);
      const res = await fetch(`/api/activity?${params}`);
      const data = await res.json();
      if (data.success) {
        setItems((prev) => (append ? [...prev, ...data.data.items] : data.data.items));
        setHasMore(data.data.hasMore);
        setNextBefore(data.data.nextBefore);
      }
    } catch {
      toast.error('Failed to load activity');
    }
  };

  useEffect(() => {
    fetchPage(null, false).finally(() => setLoading(false));
  }, []);

  const handleMore = async () => {
    setLoadingMore(true);
    await fetchPage(nextBefore, true);
    setLoadingMore(false);
  };

  const groups: { day: string; rows: any[] }[] = [];
  for (const item of items) {
    const day = dayLabel(item.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.rows.push(item);
    else groups.push({ day, rows: [item] });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#2563eb]/20 border-t-[#2563eb]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a]">My Activity</h1>
        <p className="text-gray-500 mt-1 text-sm">Everything happening in your account</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ActivityIcon className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">No activity yet</p>
          <p className="text-gray-400 text-xs mt-1">Uploads, shares, and sign-ins will appear here</p>
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.day}>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{g.day}</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100 shadow-sm">
              {g.rows.map((item) => {
                const meta = EVENT_META[item.eventType] || {
                  icon: ActivityIcon, bg: 'bg-gray-100', color: 'text-gray-500', label: () => item.eventType,
                };
                const Icon = meta.icon;
                return (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-9 h-9 ${meta.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-4 w-4 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#0f172a] truncate">{meta.label(item.resourceName)}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(item.createdAt)}
                        {item.ip ? ` • ${item.ip}` : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {hasMore && (
        <button
          onClick={handleMore}
          disabled={loadingMore}
          className="w-full py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-600 rounded-xl transition-colors"
        >
          {loadingMore ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { X, Copy, Check, Shield, ShieldOff } from 'lucide-react';
import { FileWithDetails } from '@/types';
import { formatFileSize } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ShareDialogProps {
  file: FileWithDetails;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareDialog({ file, isOpen, onClose }: ShareDialogProps) {
  const [pinProtected, setPinProtected] = useState(false);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateLink = async () => {
    if (pinProtected && pin.length !== 6) {
      toast.error('PIN must be exactly 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: file.id,
          pinProtected,
          pin: pinProtected ? pin : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShareLink(data.data.url);
        toast.success('Share link created');
      } else {
        toast.error(data.error || 'Failed to create share link');
      }
    } catch (error) {
      toast.error('Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setPinProtected(false);
    setPin('');
    setShareLink(null);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Share File
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-4">
            <div className="text-2xl">📁</div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {file.originalName}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(Number(file.size))}
              </p>
            </div>
          </div>

          {!shareLink ? (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {pinProtected ? (
                      <Shield className="h-5 w-5 text-brand-500" />
                    ) : (
                      <ShieldOff className="h-5 w-5 text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Protect download with Secret PIN
                    </span>
                  </div>
                  <button
                    onClick={() => setPinProtected(!pinProtected)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      pinProtected ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        pinProtected ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {pinProtected && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Secret PIN
                    </label>
                    <input
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      maxLength={6}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-center text-lg tracking-widest"
                      placeholder="••••••"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      PIN must be exactly 6 characters
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleCreateLink}
                disabled={loading}
                className="w-full mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? 'Creating...' : 'Create Share Link'}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm text-green-700 dark:text-green-400">
                  Share link created successfully
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Share URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <Copy className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              {pinProtected && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <Shield className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-400">
                    This link is protected with a PIN
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="w-full px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

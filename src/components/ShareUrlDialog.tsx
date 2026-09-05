'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Check, Shield, Download, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import {
  useShareSettings,
  buildSharePayload,
  validateShareSettings,
  resetShareSettings,
  ShareSettingsFields,
} from './ShareSettings';

interface ShareUrlDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function ShareUrlDialog({ isOpen, onClose, onCreated }: ShareUrlDialogProps) {
  const [url, setUrl] = useState('');
  const [settings, setSettings] = useShareSettings();
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (shareLink) {
      QRCode.toDataURL(shareLink, {
        width: 200,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      }).then(setQrDataUrl);
    }
  }, [shareLink]);

  const handleCreate = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL to share');
      return;
    }
    const err = validateShareSettings(settings);
    if (err) {
      toast.error(err);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationUrl: url.trim(),
          ...buildSharePayload(settings),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setShareLink(data.data.url);
        toast.success('Secure URL link created');
        onCreated?.();
      } else {
        toast.error(data.error || 'Failed to create link');
      }
    } catch {
      toast.error('Failed to create link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setUrl('');
    setSettings(resetShareSettings());
    setShareLink(null);
    setCopied(false);
    setQrDataUrl(null);
    onClose();
  };

  function handleDownloadQR() {
    if (qrDataUrl) {
      const a = document.createElement('a');
      a.href = qrDataUrl;
      a.download = 'qr-shared-link.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('QR code downloaded');
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-semibold text-[#0f172a]">Share a Link</h2>
          <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto">
          {!shareLink ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Destination URL
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent bg-white text-[#0f172a]"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Visitors only see this address after passing your protections
                </p>
              </div>

              <ShareSettingsFields settings={settings} setSettings={setSettings} />

              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full mt-5 px-4 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {loading ? 'Creating...' : 'Create Secure Link'}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm text-green-700 font-medium">
                  Secure link created successfully
                </span>
              </div>

              {qrDataUrl && (
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-3">
                    <img src={qrDataUrl} alt="QR Code" className="w-[180px] h-[180px]" />
                  </div>
                  <p className="text-xs text-gray-500 mb-2 text-center">
                    Scan to open {settings.pinProtected ? '(PIN required)' : ''}
                  </p>
                  <button
                    onClick={handleDownloadQR}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2563eb] bg-[#2563eb]/10 hover:bg-[#2563eb]/20 rounded-lg transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download QR
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-[#0f172a] text-sm"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-600" />}
                  </button>
                </div>
              </div>

              {settings.pinProtected && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl">
                  <Shield className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-amber-700">
                    This link is protected with a PIN
                  </span>
                </div>
              )}

            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={handleClose}
            className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

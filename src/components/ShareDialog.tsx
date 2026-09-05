'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, Shield, ShieldOff, Download, QrCode } from 'lucide-react';
import { FileWithDetails } from '@/types';
import { formatFileSize } from '@/lib/utils';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

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
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (shareLink) {
      QRCode.toDataURL(shareLink, {
        width: 200,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      }).then((url) => {
        setQrDataUrl(url);
      });
    }
  }, [shareLink]);

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
        setShareToken(data.data.token);
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

  const handleDownloadQR = () => {
    if (qrDataUrl) {
      const a = document.createElement('a');
      a.href = qrDataUrl;
      a.download = `qr-${file.originalName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('QR code downloaded');
    }
  };

  const handleClose = () => {
    setPinProtected(false);
    setPin('');
    setShareLink(null);
    setShareToken(null);
    setCopied(false);
    setQrDataUrl(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#0f172a]">
            Share File
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
            <div className="w-10 h-10 bg-[#2563eb]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[#2563eb]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-[#0f172a]">
                {file.originalName}
              </p>
              <p className="text-sm text-gray-500">
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
                      <Shield className="h-5 w-5 text-[#2563eb]" />
                    ) : (
                      <ShieldOff className="h-5 w-5 text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      Protect download with Secret PIN
                    </span>
                  </div>
                  <button
                    onClick={() => setPinProtected(!pinProtected)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      pinProtected ? 'bg-[#2563eb]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        pinProtected ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {pinProtected && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secret PIN
                    </label>
                    <input
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      maxLength={6}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent bg-white text-[#0f172a] font-mono text-center text-lg tracking-widest"
                      placeholder="------"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      PIN must be exactly 6 characters
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleCreateLink}
                disabled={loading}
                className="w-full mt-4 px-4 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {loading ? 'Creating...' : 'Create Share Link'}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm text-green-700 font-medium">
                  Share link created successfully
                </span>
              </div>

              {/* QR Code */}
              {qrDataUrl && (
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-3">
                    <img src={qrDataUrl} alt="QR Code" className="w-[180px] h-[180px]" />
                  </div>
                  <p className="text-xs text-gray-500 mb-2 text-center">
                    Scan to download {pinProtected ? '(PIN required)' : ''}
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
                    onClick={handleCopyLink}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {pinProtected && (
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

        <div className="p-4 border-t border-gray-100">
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

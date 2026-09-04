'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Download, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';

interface ShareInfo {
  fileName: string;
  fileSize: number;
  pinProtected: boolean;
  downloads: number;
  expiresAt: string | null;
}

export default function DownloadPage() {
  const params = useParams();
  const token = params.token as string;
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    fetchShareInfo();
  }, [token]);

  const fetchShareInfo = async () => {
    try {
      const response = await fetch(`/api/download/${token}`);
      const data = await response.json();

      if (data.success) {
        setShareInfo(data.data);
      } else {
        setError(data.error || 'Invalid share link');
      }
    } catch (err) {
      setError('Failed to load share information');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (shareInfo?.pinProtected && !pin) {
      setError('Please enter the PIN');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const verifyResponse = await fetch(`/api/download/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: shareInfo?.pinProtected ? pin : undefined }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 5) {
          setLocked(true);
          setError('Too many failed attempts. Please try again later.');
        } else {
          setError(verifyData.error || 'Incorrect PIN. Please try again.');
        }
        return;
      }

      const { downloadUrl, fileName } = verifyData.data;
      const finalName = fileName || shareInfo?.fileName || 'download';

      if (downloadUrl.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = finalName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const fileResponse = await fetch(downloadUrl);
        const blob = await fileResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      setPin('');
      setAttempts(0);
    } catch (err) {
      setError('Download failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error && !shareInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 mb-1">
              Link Invalid
            </h1>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Go to CloudShare
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link href="/">
            <BrandLogo size="md" />
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-center mb-5">
            <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Download className="h-6 w-6 text-gray-500" />
            </div>
            <h1 className="text-base font-bold text-gray-900 mb-0.5">
              {shareInfo?.fileName}
            </h1>
            <p className="text-sm text-gray-400">
              {formatFileSize(shareInfo?.fileSize || 0)}
            </p>
          </div>

          {shareInfo?.pinProtected && (
            <div className="mb-5">
              <div className="flex items-center justify-center gap-1.5 mb-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <Shield className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">
                  PIN protected
                </span>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Enter 6-character PIN
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={6}
                disabled={locked}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white text-center font-mono text-xl tracking-[0.4em]"
                placeholder="------"
                onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
              />
              {attempts > 0 && !locked && (
                <p className="mt-1.5 text-xs text-gray-400">
                  {5 - attempts} attempts remaining
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleDownload}
            disabled={verifying || locked || (shareInfo?.pinProtected && pin.length !== 6)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {verifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download
              </>
            )}
          </button>

          {shareInfo?.expiresAt && (
            <p className="mt-3 text-center text-xs text-gray-400">
              Expires {new Date(shareInfo.expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Cloud, Download, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';
import Link from 'next/link';

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
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error && !shareInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Link Invalid
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors"
            >
              <Cloud className="h-5 w-5" />
              Go to CloudShare
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Cloud className="h-8 w-8 text-brand-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              CloudShare
            </span>
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">📁</div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {shareInfo?.fileName}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {formatFileSize(shareInfo?.fileSize || 0)}
            </p>
          </div>

          {shareInfo?.pinProtected && (
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm text-yellow-700 dark:text-yellow-400">
                  This file is protected
                </span>
              </div>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter the 6-character Secret PIN
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={6}
                disabled={locked}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-center text-2xl tracking-[0.5em]"
                placeholder="••••••"
                onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
              />
              {attempts > 0 && !locked && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {5 - attempts} attempts remaining
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleDownload}
            disabled={verifying || locked || (shareInfo?.pinProtected && pin.length !== 6)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            {verifying ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Verify & Download
              </>
            )}
          </button>

          {shareInfo?.expiresAt && (
            <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
              This link expires on{' '}
              {new Date(shareInfo.expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

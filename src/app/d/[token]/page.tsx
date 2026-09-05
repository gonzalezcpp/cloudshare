'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Download,
  Shield,
  AlertCircle,
  Loader2,
  File,
  Calendar,
  HardDrive,
  ArrowDownToLine,
  CheckCircle2,
  Lock,
  Share2,
  Folder,
  FileText,
  DownloadCloud,
  X,
} from 'lucide-react';
import { formatFileSize } from '@/lib/utils';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';

interface SharedFile {
  id: string;
  name: string;
  size: number | string;
  mimeType: string;
}

interface ShareInfo {
  type: 'file' | 'folder';
  fileName?: string;
  fileSize?: number | string;
  folderName?: string;
  fileCount?: number;
  totalSize?: number | string;
  files?: SharedFile[];
  pinProtected: boolean;
  downloads: number;
  expiresAt: string | null;
}

function getFileExtension(name: string) {
  const ext = name.split('.').pop();
  return ext ? ext.toUpperCase() : 'FILE';
}

function getFileTypeLabel(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const types: Record<string, string> = {
    pdf: 'PDF Document',
    doc: 'Word Document',
    docx: 'Word Document',
    xls: 'Excel Spreadsheet',
    xlsx: 'Excel Spreadsheet',
    ppt: 'PowerPoint Presentation',
    pptx: 'PowerPoint Presentation',
    jpg: 'JPEG Image',
    jpeg: 'JPEG Image',
    png: 'PNG Image',
    gif: 'GIF Image',
    svg: 'SVG Image',
    webp: 'WebP Image',
    mp4: 'MP4 Video',
    mov: 'MOV Video',
    avi: 'AVI Video',
    mkv: 'MKV Video',
    mp3: 'MP3 Audio',
    wav: 'WAV Audio',
    flac: 'FLAC Audio',
    zip: 'ZIP Archive',
    rar: 'RAR Archive',
    '7z': '7-Zip Archive',
    tar: 'TAR Archive',
    gz: 'GZIP Archive',
    exe: 'Windows Executable',
    dmg: 'macOS Disk Image',
    apk: 'Android Package',
    js: 'JavaScript File',
    ts: 'TypeScript File',
    py: 'Python File',
    html: 'HTML File',
    css: 'CSS File',
    txt: 'Text File',
    csv: 'CSV File',
    json: 'JSON File',
    xml: 'XML File',
  };
  return types[ext] || 'File';
}

function getMimeIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return '🗜️';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('json') || mimeType.includes('javascript')) return '📜';
  return '📁';
}

export default function DownloadPage() {
  const params = useParams();
  const token = params.token as string;
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
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

  const verifyAccess = async () => {
    if (shareInfo?.pinProtected && !pin) {
      setError('Please enter the PIN');
      return null;
    }

    setVerifying(true);
    setError(null);

    try {
      const verifyResponse = await fetch(`/api/download/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: shareInfo?.pinProtected ? pin.trim() : undefined,
        }),
      });

      if (!verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        // If it's a ZIP response, it's actually a download
        if (verifyResponse.headers.get('content-type')?.includes('application/zip')) {
          return verifyResponse;
        }
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 5) {
          setLocked(true);
          setError('Too many failed attempts. Please try again later.');
        } else {
          setError(verifyData.error || 'Incorrect PIN. Please try again.');
        }
        return null;
      }

      return verifyResponse;
    } catch (err) {
      setError('Download failed. Please try again.');
      return null;
    } finally {
      setVerifying(false);
    }
  };

  const triggerBlobDownload = (url: string, filename: string) => {
    if (url.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      fetch(url)
        .then((r) => r.blob())
        .then((blob) => {
          const objectUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = objectUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(objectUrl);
          document.body.removeChild(a);
        });
    }
    setPin('');
    setAttempts(0);
  };

  const handleDownload = async () => {
    const response = await verifyAccess();
    if (!response) return;

    const isZip = response.headers.get('content-type')?.includes('application/zip');
    if (isZip) {
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `${shareInfo?.folderName || 'folder'}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(objectUrl);
      document.body.removeChild(a);
      setPin('');
      setAttempts(0);
      toastSuccess('Folder downloaded as ZIP');
      return;
    }

    const verifyData = await response.json();
    const { downloadUrl, fileName } = verifyData.data;
    const finalName = fileName || shareInfo?.fileName || 'download';
    triggerBlobDownload(downloadUrl, finalName);
  };

  const handleDownloadFile = async (fileId: string) => {
    if (shareInfo?.pinProtected && !pin) {
      setError('Please enter the PIN');
      return;
    }

    setDownloadingFile(fileId);
    setError(null);

    try {
      const response = await fetch(`/api/download/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: shareInfo?.pinProtected ? pin.trim() : undefined,
          fileId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Download failed. Please try again.');
        return;
      }

      const data = await response.json();
      const { downloadUrl, fileName } = data.data;
      triggerBlobDownload(downloadUrl, fileName || 'download');
    } catch (err) {
      setError('Download failed. Please try again.');
    } finally {
      setDownloadingFile(null);
    }
  };

  const toastSuccess = (msg: string) => {
    // Minimal to avoid importing toast on this light page
  };

  const fileType =
    shareInfo && shareInfo.type === 'file'
      ? getFileTypeLabel(shareInfo.fileName || '')
      : 'Folder';

  const ext =
    shareInfo && shareInfo.type === 'file'
      ? getFileExtension(shareInfo.fileName || '')
      : 'DIR';

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#2563eb] mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !shareInfo) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-100">
          <div className="container mx-auto px-6 py-4">
            <Link href="/">
              <BrandLogo size="md" />
            </Link>
          </div>
        </header>
        <div className="flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 65px)' }}>
          <div className="w-full max-w-md text-center">
            <div className="bg-white rounded-2xl border border-gray-200 p-10 shadow-sm">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h1 className="text-xl font-bold text-[#0f172a] mb-2">
                Link Invalid
              </h1>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">{error}</p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Go to CloudShare
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <BrandLogo size="md" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-semibold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-2xl">
        {/* File/Folder Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 pb-5">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`w-16 h-16 ${shareInfo?.type === 'folder' ? 'bg-[#7c3aed]/10' : 'bg-[#2563eb]/10'} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                {shareInfo?.type === 'folder' ? (
                  <Folder className="h-8 w-8 text-[#7c3aed]" />
                ) : (
                  <span className="text-sm font-bold text-[#2563eb]">{ext}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-[#0f172a] truncate leading-tight">
                  {shareInfo?.type === 'folder'
                    ? shareInfo.folderName
                    : shareInfo?.fileName}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {shareInfo?.type === 'folder'
                    ? `${shareInfo.fileCount || 0} files`
                    : fileType}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  {shareInfo?.type === 'file' && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <HardDrive className="h-3.5 w-3.5" />
                      {formatFileSize(Number(shareInfo.fileSize || 0))}
                    </span>
                  )}
                  {shareInfo?.type === 'folder' && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <HardDrive className="h-3.5 w-3.5" />
                      {formatFileSize(Number(shareInfo.totalSize || 0))} total
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <ArrowDownToLine className="h-3.5 w-3.5" />
                    {shareInfo?.downloads || 0} downloads
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* PIN Section */}
          {shareInfo?.pinProtected && (
            <div className="px-6 pb-5">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-800">
                    This {shareInfo.type === 'folder' ? 'folder' : 'file'} is PIN protected
                  </span>
                </div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Enter 6-character PIN to download
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={6}
                  disabled={locked}
                  className="w-full px-4 py-3 border border-amber-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent bg-white text-center font-mono text-2xl tracking-[0.5em] text-[#0f172a]"
                  placeholder="------"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && shareInfo?.type === 'folder') {
                      handleDownload();
                    } else if (e.key === 'Enter' && shareInfo?.type === 'file') {
                      handleDownload();
                    }
                  }}
                />
                {attempts > 0 && !locked && (
                  <p className="mt-2 text-xs text-amber-600">
                    {5 - attempts} attempts remaining
                  </p>
                )}
                {locked && (
                  <p className="mt-2 text-xs text-red-600 font-medium">
                    Too many failed attempts. Try again later.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-6 pb-5">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Folder: File List */}
          {shareInfo?.type === 'folder' && (
            <div className="px-6 pb-6">
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                {shareInfo.files && shareInfo.files.length > 0 ? (
                  shareInfo.files.map((f, idx) => (
                    <div
                      key={f.id}
                      className={`flex items-center gap-3 px-4 py-3 ${
                        idx !== 0 ? 'border-t border-gray-100' : ''
                      } hover:bg-gray-50/50 transition-colors`}
                    >
                      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 text-lg">
                        {getMimeIcon(f.mimeType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0f172a] truncate">
                          {f.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatFileSize(Number(f.size))}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownloadFile(f.id)}
                        disabled={verifying || locked || downloadingFile === f.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2563eb] bg-[#2563eb]/10 hover:bg-[#2563eb]/20 rounded-lg transition-colors"
                      >
                        {downloadingFile === f.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        Download
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <X className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">This folder is empty</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Download Buttons */}
          <div className="px-6 pb-6">
            {shareInfo?.type === 'file' ? (
              <button
                onClick={handleDownload}
                disabled={verifying || locked || (shareInfo?.pinProtected && pin.length !== 6)}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-gray-300 text-white text-base font-bold rounded-xl transition-all shadow-lg shadow-[#2563eb]/20 hover:shadow-xl hover:shadow-[#2563eb]/30 disabled:shadow-none"
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verifying PIN...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Download {formatFileSize(Number(shareInfo?.fileSize || 0))}
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleDownload}
                  disabled={verifying || locked || (('files' in shareInfo! && shareInfo.files!.length === 0))}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-gray-300 text-white text-base font-bold rounded-xl transition-all shadow-lg shadow-[#2563eb]/20 hover:shadow-xl hover:shadow-[#2563eb]/30 disabled:shadow-none"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating ZIP...
                    </>
                  ) : (
                    <>
                      <DownloadCloud className="h-5 w-5" />
                      Download All (.zip)
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={verifying || locked}
                  className="w-full flex items-center justify-center gap-3 py-3 px-6 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
                >
                  <Folder className="h-4 w-4" />
                  Download entire folder
                </button>
              </div>
            )}
            {shareInfo?.pinProtected && (
              <p className="text-center text-xs text-gray-400 mt-2">
                Enter your PIN above, then click download
              </p>
            )}
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mt-4 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-[#0f172a]">
              {shareInfo?.type === 'folder' ? 'Folder Details' : 'File Details'}
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            <div className="flex items-center justify-between px-6 py-3">
              <span className="text-sm text-gray-500">Name</span>
              <span className="text-sm font-medium text-[#0f172a] truncate max-w-[200px]">
                {shareInfo?.type === 'folder' ? shareInfo?.folderName : shareInfo?.fileName}
              </span>
            </div>
            <div className="flex items-center justify-between px-6 py-3">
              <span className="text-sm text-gray-500">Type</span>
              <span className="text-sm font-medium text-[#0f172a]">{fileType}</span>
            </div>
            {shareInfo?.type === 'folder' && (
              <>
                <div className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm text-gray-500">Files</span>
                  <span className="text-sm font-medium text-[#0f172a]">{shareInfo?.fileCount || 0}</span>
                </div>
                <div className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm text-gray-500">Total size</span>
                  <span className="text-sm font-medium text-[#0f172a]">{formatFileSize(Number(shareInfo?.totalSize || 0))}</span>
                </div>
              </>
            )}
            {shareInfo?.type === 'file' && (
              <div className="flex items-center justify-between px-6 py-3">
                <span className="text-sm text-gray-500">File size</span>
                <span className="text-sm font-medium text-[#0f172a]">{formatFileSize(Number(shareInfo?.fileSize || 0))}</span>
              </div>
            )}
            <div className="flex items-center justify-between px-6 py-3">
              <span className="text-sm text-gray-500">Total downloads</span>
              <span className="text-sm font-medium text-[#0f172a]">{shareInfo?.downloads || 0}</span>
            </div>
            {shareInfo?.expiresAt && (
              <div className="flex items-center justify-between px-6 py-3">
                <span className="text-sm text-gray-500">Expires</span>
                <span className="text-sm font-medium text-[#0f172a]">
                  {new Date(shareInfo.expiresAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Security Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mt-4 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#10b981]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="h-6 w-6 text-[#10b981]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#0f172a] mb-1">Secure download</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                This {shareInfo?.type === 'folder' ? 'folder' : 'file'} is shared via CloudShare with end-to-end encryption.
                {shareInfo?.pinProtected && ' Extra PIN protection is enabled for additional security.'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-[#10b981] mx-auto mb-1" />
              <p className="text-xs font-medium text-gray-600">Encrypted</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-[#10b981] mx-auto mb-1" />
              <p className="text-xs font-medium text-gray-600">Verified</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-[#10b981] mx-auto mb-1" />
              <p className="text-xs font-medium text-gray-600">Safe</p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mt-4 p-6">
          <h3 className="font-semibold text-[#0f172a] mb-4">How to download</h3>
          <div className="space-y-3">
            {[
              { step: '1', text: shareInfo?.pinProtected ? 'Enter the 6-character PIN provided by the sender' : 'Click the download button above' },
              { step: '2', text: 'Your files will begin downloading automatically' },
              { step: '3', text: 'Save the files to your preferred location' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#2563eb]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-[#2563eb]">{item.step}</span>
                </div>
                <p className="text-sm text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white mt-10">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Secured by{' '}
            <span className="font-semibold" style={{ color: '#2563eb' }}>Cloud</span>
            <span className="font-semibold" style={{ color: '#7c3aed' }}>Share</span>
          </p>
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Go to CloudShare
          </Link>
        </div>
      </footer>
    </div>
  );
}
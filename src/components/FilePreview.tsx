'use client';

import { useEffect, useState } from 'react';
import { X, Download, Loader2, FileText } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';
import toast from 'react-hot-toast';

interface FilePreviewProps {
  fileId: string | null;
  fileName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FilePreview({ fileId, fileName, isOpen, onClose }: FilePreviewProps) {
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('');
  const [name, setName] = useState('');
  const [size, setSize] = useState(0);
  const [textContent, setTextContent] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !fileId) return;
    setLoading(true);
    setUrl(null);
    setTextContent(null);
    fetch(`/api/files/${fileId}/preview`)
      .then((r) => r.json())
      .then(async (data) => {
        if (!data.success) throw new Error(data.error);
        setUrl(data.data.url);
        setMimeType(data.data.mimeType);
        setName(data.data.name);
        setSize(data.data.size);
        // fetch text for text-ish files (limit 100KB)
        if (
          data.data.mimeType.startsWith('text/') ||
          data.data.mimeType.includes('json') ||
          data.data.mimeType.includes('javascript') ||
          data.data.url.startsWith('data:text')
        ) {
          try {
            const t = await (await fetch(data.data.url)).text();
            setTextContent(t.slice(0, 100000));
          } catch {}
        }
      })
      .catch(() => toast.error('Failed to load preview'))
      .finally(() => setLoading(false));
  }, [isOpen, fileId]);

  if (!isOpen) return null;

  const isImage = mimeType.startsWith('image/');
  const isVideo = mimeType.startsWith('video/');
  const isAudio = mimeType.startsWith('audio/');
  const isPdf = mimeType === 'application/pdf';
  const isText = textContent !== null || mimeType.startsWith('text/');

  const handleDownload = () => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = name || fileName || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="min-w-0">
            <h2 className="font-semibold text-[#0f172a] truncate">{name || fileName}</h2>
            <p className="text-xs text-gray-400">{mimeType} {size ? `• ${formatFileSize(size)}` : ''}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg"
            >
              <Download className="h-4 w-4" /> Download
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center min-h-[300px] p-4">
          {loading ? (
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#2563eb] mx-auto mb-2" />
              <p className="text-sm text-gray-400">Loading preview...</p>
            </div>
          ) : !url ? (
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No preview available</p>
            </div>
          ) : isImage ? (
            <img src={url} alt={name} className="max-w-full max-h-[65vh] rounded-lg shadow-sm object-contain" />
          ) : isVideo ? (
            <video src={url} controls className="max-w-full max-h-[65vh] rounded-lg shadow-sm" />
          ) : isAudio ? (
            <div className="w-full max-w-md bg-white rounded-xl border p-6 text-center">
              <div className="text-5xl mb-4">🎵</div>
              <p className="font-medium text-sm mb-4 truncate">{name}</p>
              <audio src={url} controls className="w-full" />
            </div>
          ) : isPdf ? (
            <iframe src={url} className="w-full h-[65vh] rounded-lg bg-white border" title={name} />
          ) : isText && textContent !== null ? (
            <pre className="w-full h-[65vh] overflow-auto bg-[#0f172a] text-gray-100 text-xs p-4 rounded-lg whitespace-pre-wrap break-words text-left">
              {textContent}
            </pre>
          ) : (
            <div className="text-center bg-white rounded-xl border p-10">
              <div className="text-5xl mb-3">📁</div>
              <p className="font-medium text-[#0f172a] mb-1">{name}</p>
              <p className="text-sm text-gray-400 mb-4">Preview not supported for this file type</p>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white text-sm font-medium rounded-lg"
              >
                <Download className="h-4 w-4" /> Download to view
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

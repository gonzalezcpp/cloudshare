'use client';

import { useEffect, useState } from 'react';
import { Trash2, RotateCcw, XCircle, FolderOpen, AlertTriangle } from 'lucide-react';
import { formatFileSize, formatDate, getFileIcon } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function TrashPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/trash');
      const data = await res.json();
      if (data.success) {
        setFiles(data.data.files);
        setFolders(data.data.folders);
      }
    } catch {
      toast.error('Failed to load trash');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (type: 'file' | 'folder', id: string) => {
    setActioning(id);
    try {
      const res = await fetch('/api/trash/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Restored');
        fetchTrash();
      } else {
        toast.error(data.error || 'Restore failed');
      }
    } catch {
      toast.error('Restore failed');
    } finally {
      setActioning(null);
    }
  };

  const handlePermanentDelete = async (type: 'file' | 'folder', id: string, name: string) => {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    setActioning(id);
    try {
      const res = await fetch(`/api/trash/${type}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Permanently deleted');
        fetchTrash();
      } else {
        toast.error(data.error || 'Delete failed');
      }
    } catch {
      toast.error('Delete failed');
    } finally {
      setActioning(null);
    }
  };

  const handleEmpty = async () => {
    if (!confirm('Empty trash? All items will be permanently deleted.')) return;
    try {
      const res = await fetch('/api/trash', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Trash emptied');
        fetchTrash();
      } else {
        toast.error(data.error || 'Failed');
      }
    } catch {
      toast.error('Failed to empty trash');
    }
  };

  const total = files.length + folders.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#2563eb]/20 border-t-[#2563eb]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Trash</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {total === 0 ? 'Trash is empty' : `${total} item(s) — auto-deletes after 30 days`}
          </p>
        </div>
        {total > 0 && (
          <button
            onClick={handleEmpty}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Empty Trash
          </button>
        )}
      </div>

      {total === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">Nothing in trash</p>
          <p className="text-gray-400 text-xs mt-1">Deleted files and folders will appear here</p>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Items in trash still count toward your storage. Restore them or delete forever to free space.
            </p>
          </div>

          {folders.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Folders</h2>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                {folders.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0f172a] truncate">{f.name}</p>
                      <p className="text-xs text-gray-400">Deleted {formatDate(f.deletedAt)} • {f._count?.files || 0} files</p>
                    </div>
                    <button
                      onClick={() => handleRestore('folder', f.id)}
                      disabled={actioning === f.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2563eb] bg-[#2563eb]/10 hover:bg-[#2563eb]/20 rounded-lg"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Restore
                    </button>
                    <button
                      onClick={() => handlePermanentDelete('folder', f.id, f.name)}
                      disabled={actioning === f.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Delete forever
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Files</h2>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                {files.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 text-xl">
                      {getFileIcon(f.mimeType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0f172a] truncate">{f.originalName}</p>
                      <p className="text-xs text-gray-400">
                        {formatFileSize(Number(f.size))} • Deleted {formatDate(f.deletedAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRestore('file', f.id)}
                      disabled={actioning === f.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2563eb] bg-[#2563eb]/10 hover:bg-[#2563eb]/20 rounded-lg"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Restore
                    </button>
                    <button
                      onClick={() => handlePermanentDelete('file', f.id, f.originalName)}
                      disabled={actioning === f.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Delete forever
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

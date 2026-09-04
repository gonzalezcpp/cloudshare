'use client';

import { useState, useEffect } from 'react';
import { X, FolderInput } from 'lucide-react';
import toast from 'react-hot-toast';

interface Folder {
  id: string;
  name: string;
}

interface MoveFileDialogProps {
  fileId: string;
  currentFolderId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onMoveComplete?: () => void;
}

export function MoveFileDialog({
  fileId,
  currentFolderId,
  isOpen,
  onClose,
  onMoveComplete,
}: MoveFileDialogProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchFolders();
    }
  }, [isOpen]);

  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/folders');
      const data = await response.json();
      if (data.success) {
        setFolders(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch folders');
    }
  };

  const handleMove = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: selectedFolderId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('File moved successfully');
        onClose();
        onMoveComplete?.();
      } else {
        toast.error(data.error || 'Failed to move file');
      }
    } catch (error) {
      toast.error('Failed to move file');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Move File
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-96">
          <div className="space-y-2">
            <button
              onClick={() => setSelectedFolderId(null)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                selectedFolderId === null
                  ? 'bg-brand-50 dark:bg-brand-900/50 border border-brand-500'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
              }`}
            >
              <FolderInput className="h-5 w-5 text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">
                Root (No folder)
              </span>
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                disabled={folder.id === currentFolderId}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  selectedFolderId === folder.id
                    ? 'bg-brand-50 dark:bg-brand-900/50 border border-brand-500'
                    : folder.id === currentFolderId
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
                }`}
              >
                <span className="text-xl">📁</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {folder.name}
                </span>
                {folder.id === currentFolderId && (
                  <span className="ml-auto text-xs text-gray-400">
                    Current
                  </span>
                )}
              </button>
            ))}
            {folders.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                No folders yet. Create a folder first.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            disabled={loading || selectedFolderId === currentFolderId}
            className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Moving...' : 'Move Here'}
          </button>
        </div>
      </div>
    </div>
  );
}

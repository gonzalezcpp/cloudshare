'use client';

import { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import toast from 'react-hot-toast';

interface CreateFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  parentId?: string;
  onFolderCreated?: () => void;
}

export function CreateFolderDialog({
  isOpen,
  onClose,
  parentId,
  onFolderCreated,
}: CreateFolderDialogProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), parentId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Folder created');
        setName('');
        onClose();
        onFolderCreated?.();
      } else {
        toast.error(data.error || 'Failed to create folder');
      }
    } catch (error) {
      toast.error('Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create Folder
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <FolderPlus className="h-5 w-5 text-brand-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Enter folder name
            </span>
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="New folder"
            autoFocus
          />
        </div>

        <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

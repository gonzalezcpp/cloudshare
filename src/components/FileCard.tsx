'use client';

import { useState } from 'react';
import { FileWithDetails } from '@/types';
import { formatFileSize, formatDate, getFileIcon, truncateFilename } from '@/lib/utils';
import {
  Download,
  Share2,
  Trash2,
  Edit2,
  FolderInput,
  MoreVertical,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileCardProps {
  file: FileWithDetails;
  onShare: (file: FileWithDetails) => void;
  onRename: (file: FileWithDetails) => void;
  onDelete: (file: FileWithDetails) => void;
  onMove: (file: FileWithDetails) => void;
}

export function FileCard({
  file,
  onShare,
  onRename,
  onDelete,
  onMove,
}: FileCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className="text-3xl">{getFileIcon(file.mimeType)}</div>
        <div className="flex-1 min-w-0">
          <h3
            className="font-medium text-gray-900 dark:text-white truncate"
            title={file.originalName}
          >
            {truncateFilename(file.originalName)}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {formatFileSize(Number(file.size))}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {formatDate(file.createdAt)}
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-5 w-5 text-gray-400" />
          </button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <button
                  onClick={() => {
                    onShare(file);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
                <button
                  onClick={() => {
                    onRename(file);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Edit2 className="h-4 w-4" />
                  Rename
                </button>
                <button
                  onClick={() => {
                    onMove(file);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FolderInput className="h-4 w-4" />
                  Move
                </button>
                <button
                  onClick={() => {
                    onDelete(file);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {file.shareLinks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-3 w-3 text-brand-500" />
            <span className="text-xs text-brand-600 dark:text-brand-400">
              {file.shareLinks.length} share link(s)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { FileCard } from '@/components/FileCard';
import { SearchBar } from '@/components/SearchBar';
import { SortSelect } from '@/components/SortSelect';
import { ShareDialog } from '@/components/ShareDialog';
import { CreateFolderDialog } from '@/components/CreateFolderDialog';
import { RenameFileDialog } from '@/components/RenameFileDialog';
import { MoveFileDialog } from '@/components/MoveFileDialog';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { FileWithDetails, SortField, SortDirection } from '@/types';
import { FolderOpen, FolderPlus, ArrowLeft, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FilesPage() {
  const [files, setFiles] = useState<FileWithDetails[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortField>('createdAt');
  const [direction, setDirection] = useState<SortDirection>('desc');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string>('');

  const [shareDialogFile, setShareDialogFile] = useState<FileWithDetails | null>(null);
  const [shareDialogFolder, setShareDialogFolder] = useState<any | null>(null);
  const [renameDialogFile, setRenameDialogFile] = useState<FileWithDetails | null>(null);
  const [moveDialogFile, setMoveDialogFile] = useState<FileWithDetails | null>(null);
  const [deleteDialogFile, setDeleteDialogFile] = useState<FileWithDetails | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        sort,
        direction,
      });
      if (currentFolderId) {
        params.set('folderId', currentFolderId);
      }

      const response = await fetch(`/api/files?${params}`);
      const data = await response.json();
      if (data.success) {
        setFiles(data.data.files);
        setFolders(data.data.folders);
      }
    } catch (error) {
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [search, sort, direction, currentFolderId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleSortChange = (newSort: SortField, newDirection: SortDirection) => {
    setSort(newSort);
    setDirection(newDirection);
  };

  const handleDelete = async () => {
    if (!deleteDialogFile) return;
    const response = await fetch(`/api/files/${deleteDialogFile.id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete file');
    }
    fetchFiles();
  };

  const handleFolderClick = (folder: any) => {
    setCurrentFolderId(folder.id);
    setCurrentFolderName(folder.name);
  };

  const handleBackClick = () => {
    setCurrentFolderId(null);
    setCurrentFolderName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {currentFolderId ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleBackClick}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-[#0f172a]">
                {currentFolderName}
              </h1>
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-[#0f172a]">
              My Files
            </h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateFolder(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
          >
            <FolderPlus className="h-4 w-4" />
            New Folder
          </button>
        </div>
      </div>

      <FileUploader folderId={currentFolderId || undefined} onUploadComplete={fetchFiles} />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search files..."
          />
        </div>
        <SortSelect
          sort={sort}
          direction={direction}
          onSortChange={handleSortChange}
        />
      </div>

      {folders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {folders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => handleFolderClick(folder)}
              className="relative flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <div className="w-12 h-12 bg-[#2563eb]/10 rounded-xl flex items-center justify-center mb-2">
                <FolderOpen className="h-6 w-6 text-[#2563eb]" />
              </div>
              <p className="text-sm font-medium text-[#0f172a] truncate w-full text-center">
                {folder.name}
              </p>
              <p className="text-xs text-gray-400">
                {folder._count?.files || 0} files
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShareDialogFolder(folder);
                }}
                className="absolute top-2 right-2 p-1.5 hover:bg-[#2563eb]/10 rounded-lg transition-colors"
                title="Share folder"
              >
                <Share2 className="h-4 w-4 text-gray-400 hover:text-[#2563eb]" />
              </button>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#2563eb]/20 border-t-[#2563eb]" />
        </div>
      ) : files.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onShare={setShareDialogFile}
              onRename={setRenameDialogFile}
              onDelete={setDeleteDialogFile}
              onMove={setMoveDialogFile}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">
            {search ? 'No files match your search' : 'No files in this folder'}
          </p>
        </div>
      )}

      {shareDialogFile && (
        <ShareDialog
          target={{
            id: shareDialogFile.id,
            name: shareDialogFile.originalName,
            size: shareDialogFile.size,
            isFolder: false,
          }}
          isOpen={true}
          onClose={() => setShareDialogFile(null)}
        />
      )}

      {shareDialogFolder && (
        <ShareDialog
          target={{
            id: shareDialogFolder.id,
            name: shareDialogFolder.name,
            fileCount: shareDialogFolder._count?.files || 0,
            isFolder: true,
          }}
          isOpen={true}
          onClose={() => setShareDialogFolder(null)}
        />
      )}

      {renameDialogFile && (
        <RenameFileDialog
          fileId={renameDialogFile.id}
          currentName={renameDialogFile.originalName}
          isOpen={true}
          onClose={() => setRenameDialogFile(null)}
          onRenameComplete={fetchFiles}
        />
      )}

      {moveDialogFile && (
        <MoveFileDialog
          fileId={moveDialogFile.id}
          currentFolderId={moveDialogFile.folderId}
          isOpen={true}
          onClose={() => setMoveDialogFile(null)}
          onMoveComplete={fetchFiles}
        />
      )}

      {deleteDialogFile && (
        <DeleteConfirmDialog
          title="Delete File"
          message={`Are you sure you want to delete "${deleteDialogFile.originalName}"? This action cannot be undone.`}
          isOpen={true}
          onClose={() => setDeleteDialogFile(null)}
          onConfirm={handleDelete}
        />
      )}

      <CreateFolderDialog
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        parentId={currentFolderId || undefined}
        onFolderCreated={fetchFiles}
      />
    </div>
  );
}

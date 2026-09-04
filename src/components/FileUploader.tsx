'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface FileUploaderProps {
  folderId?: string;
  onUploadComplete?: () => void;
}

export function FileUploader({ folderId, onUploadComplete }: FileUploaderProps) {
  const router = useRouter();
  const [uploads, setUploads] = useState<{
    fileId: string;
    filename: string;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
  }[]>([]);

  const uploadFile = async (file: File) => {
    const fileId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    setUploads((prev) => [
      ...prev,
      {
        fileId,
        filename: file.name,
        progress: 0,
        status: 'uploading',
      },
    ]);

    try {
      const presignRes = await fetch('/api/files/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          folderId,
        }),
      });

      const presignData = await presignRes.json();

      if (!presignData.success) {
        setUploads((prev) =>
          prev.map((u) =>
            u.fileId === fileId ? { ...u, status: 'error', error: presignData.error } : u
          )
        );
        return;
      }

      const { uploadUrl, storagePath, originalName } = presignData.data;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setUploads((prev) =>
              prev.map((u) =>
                u.fileId === fileId ? { ...u, progress: pct } : u
              )
            );
          }
        });

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error('Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Network error'));

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      const confirmRes = await fetch('/api/files/upload/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          storagePath,
          originalName: file.name,
          fileSize: file.size,
          fileType: file.type,
          folderId,
        }),
      });

      const confirmData = await confirmRes.json();

      if (confirmData.success) {
        setUploads((prev) =>
          prev.map((u) =>
            u.fileId === fileId ? { ...u, status: 'completed', progress: 100 } : u
          )
        );
      } else {
        setUploads((prev) =>
          prev.map((u) =>
            u.fileId === fileId ? { ...u, status: 'error', error: confirmData.error } : u
          )
        );
      }
    } catch (e) {
      setUploads((prev) =>
        prev.map((u) =>
          u.fileId === fileId ? { ...u, status: 'error', error: 'Upload failed' } : u
        )
      );
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        await uploadFile(file);
      }
      onUploadComplete?.();
      router.refresh();
    },
    [folderId, onUploadComplete, router]
  );

  const removeUpload = (fileId: string) => {
    setUploads((prev) => prev.filter((u) => u.fileId !== fileId));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
          isDragActive
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
        )}
      >
        <input {...getInputProps()} />
        <Upload
          className={cn(
            'h-12 w-12 mx-auto mb-4',
            isDragActive
              ? 'text-brand-500'
              : 'text-gray-400 dark:text-gray-500'
          )}
        />
        {isDragActive ? (
          <p className="text-lg font-medium text-brand-600 dark:text-brand-400">
            Drop the files here
          </p>
        ) : (
          <>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Up to 64MB per file
            </p>
          </>
        )}
      </div>

      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload) => (
            <div
              key={upload.fileId}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <File className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  {upload.filename}
                </p>
                {upload.status === 'uploading' && (
                  <div className="mt-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}
                {upload.status === 'error' && (
                  <p className="text-xs text-red-500 mt-1">{upload.error}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {upload.status === 'completed' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {upload.status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <button
                  onClick={() => removeUpload(upload.fileId)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { User, File, Folder, ShareLink, PinAttempt, DownloadHistory } from '@prisma/client';

export type { User, File, Folder, ShareLink, PinAttempt, DownloadHistory };

export interface DownloadHistoryItem {
  id: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
}

export interface FileWithDetails extends File {
  shareLinks: ShareLink[];
  folder?: Folder | null;
}

export interface ShareLinkWithFile extends ShareLink {
  file: File;
}

export interface DashboardStats {
  totalFiles: number;
  totalFolders: number;
  totalSharedLinks: number;
  storageUsed: number;
  storageLimit: number;
  totalDownloads: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UploadProgress {
  fileId: string;
  filename: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface ShareLinkCreateInput {
  fileId: string;
  pinProtected?: boolean;
  pin?: string;
  maxDownloads?: number;
  expiresAt?: Date;
}

export interface PinVerificationInput {
  token: string;
  pin: string;
}

export interface FileOperation {
  type: 'rename' | 'move' | 'delete';
  fileId: string;
  newName?: string;
  folderId?: string;
}

export interface FolderCreateInput {
  name: string;
  parentId?: string;
}

export type SortField = 'filename' | 'size' | 'createdAt' | 'downloadCount';
export type SortDirection = 'asc' | 'desc';

export interface FileFilters {
  search?: string;
  sort?: SortField;
  direction?: SortDirection;
  mimeType?: string;
  folderId?: string;
}

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  FolderOpen,
  Share2,
  HardDrive,
  TrendingUp,
  Upload,
} from 'lucide-react';
import { StorageUsage } from '@/components/StorageUsage';
import { formatDate, formatFileSize } from '@/lib/utils';
import { DashboardStats } from '@/types';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const data = await response.json();
      if (data.success) {
        setStats(data.data.stats);
        setRecentFiles(data.data.recentFiles);
      }
    } catch (error) {
      console.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, <span className="bg-gradient-to-r from-cyan-500 to-violet-500 bg-clip-text text-transparent">{session?.user?.name || 'User'}</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Here&apos;s an overview of your files
          </p>
        </div>
        <Link
          href="/files"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/25 hover:shadow-xl"
        >
          <Upload className="h-5 w-5" />
          Upload Files
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-none hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Files
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats?.totalFiles || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <FolderOpen className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-none hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Shared Links
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats?.totalDownloads || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
              <Share2 className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-none hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Downloads
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats?.totalDownloads || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-none hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Storage Used
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatFileSize(Number(stats?.storageUsed || 0))}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
              <HardDrive className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <StorageUsage
        used={stats?.storageUsed || 0}
        limit={stats?.storageLimit || 10737418240}
      />

      <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-none">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Recent Files
          </h2>
        </div>
        <div className="p-4">
          {recentFiles.length > 0 ? (
            <div className="space-y-2">
              {recentFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 rounded-xl flex items-center justify-center">
                      <FolderOpen className="h-5 w-5 text-cyan-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {file.originalName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(Number(file.size))} &middot;{' '}
                        {formatDate(file.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/files"
                    className="text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                No files yet. Upload your first file!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

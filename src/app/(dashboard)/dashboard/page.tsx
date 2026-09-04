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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {session?.user?.name || 'User'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here&apos;s an overview of your files
          </p>
        </div>
        <Link
          href="/files"
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors"
        >
          <Upload className="h-5 w-5" />
          Upload Files
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Files
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats?.totalFiles || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/50 rounded-xl flex items-center justify-center">
              <FolderOpen className="h-6 w-6 text-brand-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Shared Links
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats?.totalDownloads || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
              <Share2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Downloads
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats?.totalDownloads || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Storage Used
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatFileSize(Number(stats?.storageUsed || 0))}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-xl flex items-center justify-center">
              <HardDrive className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <StorageUsage
        used={stats?.storageUsed || 0}
        limit={stats?.storageLimit || 10737418240}
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Files
          </h2>
        </div>
        <div className="p-4">
          {recentFiles.length > 0 ? (
            <div className="space-y-3">
              {recentFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">📁</div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {file.originalName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(Number(file.size))} •{' '}
                        {formatDate(file.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/files"
                    className="text-sm text-brand-600 hover:text-brand-700"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No files yet. Upload your first file!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

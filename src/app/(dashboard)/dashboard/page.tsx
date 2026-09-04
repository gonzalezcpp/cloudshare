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
  ArrowUpRight,
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
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Files', value: stats?.totalFiles || 0, icon: FolderOpen, color: 'bg-blue-50 text-blue-600' },
    { label: 'Shared Links', value: stats?.totalSharedLinks || 0, icon: Share2, color: 'bg-green-50 text-green-600' },
    { label: 'Downloads', value: stats?.totalDownloads || 0, icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
    { label: 'Storage Used', value: formatFileSize(Number(stats?.storageUsed || 0)), icon: HardDrive, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {session?.user?.name || 'User'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Here&apos;s an overview of your files
          </p>
        </div>
        <Link
          href="/files"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Upload className="h-4 w-4" />
          Upload
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{card.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <StorageUsage
        used={stats?.storageUsed || 0}
        limit={stats?.storageLimit || 10737418240}
      />

      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Files</h2>
        </div>
        <div className="p-4">
          {recentFiles.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.originalName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatFileSize(Number(file.size))} &middot; {formatDate(file.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/files"
                    className="text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 flex-shrink-0 ml-4"
                  >
                    View
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FolderOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                No files yet
              </p>
              <Link
                href="/files"
                className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-gray-900 hover:underline"
              >
                Upload your first file
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

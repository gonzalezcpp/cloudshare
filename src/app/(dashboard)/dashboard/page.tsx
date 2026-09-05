'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  FolderOpen,
  Share2,
  HardDrive,
  TrendingUp,
  Upload,
  Search,
  Bell,
  Cloud,
  Link2,
  Shield,
  UserPlus,
  FileCheck,
  Sparkles,
  ArrowRight,
  UploadCloud,
  Download,
  Clock,
} from 'lucide-react';
import { formatDate, formatFileSize } from '@/lib/utils';
import { DashboardStats, DownloadHistoryItem } from '@/types';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStats();
    fetchDownloadHistory();
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

  const fetchDownloadHistory = async () => {
    try {
      const response = await fetch('/api/downloads');
      const data = await response.json();
      if (data.success) {
        setDownloadHistory(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch download history');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#2563eb]/20 border-t-[#2563eb]" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Files', value: stats?.totalFiles || 0, suffix: 'files', icon: FolderOpen, color: 'bg-[#2563eb]/10 text-[#2563eb]' },
    { label: 'Shared Links', value: stats?.totalSharedLinks || 0, suffix: 'links', icon: Share2, color: 'bg-[#10b981]/10 text-[#10b981]' },
    { label: 'Downloads', value: stats?.totalDownloads || 0, suffix: 'times', icon: TrendingUp, color: 'bg-[#7c3aed]/10 text-[#7c3aed]' },
    { label: 'Storage Used', value: formatFileSize(Number(stats?.storageUsed || 0)), suffix: `of ${formatFileSize(Number(stats?.storageLimit || 10737418240))}`, icon: HardDrive, color: 'bg-[#f59e0b]/10 text-[#f59e0b]' },
  ];

  const recentActivity = [
    { icon: UserPlus, color: 'bg-[#2563eb]/10 text-[#2563eb]', text: 'You joined CloudShare', time: 'Just now' },
    { icon: FileCheck, color: 'bg-[#10b981]/10 text-[#10b981]', text: 'Account created', time: 'Just now' },
    { icon: Sparkles, color: 'bg-[#7c3aed]/10 text-[#7c3aed]', text: 'Welcome to CloudShare!', time: 'Just now' },
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">
              Welcome back, {session?.user?.name || 'User'} <span className="inline-block">{'\u{1F44B}'}</span>
            </h1>
            <p className="text-gray-500 mt-0.5 text-sm">
              Here&apos;s what&apos;s happening with your files today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search files, folders..."
                className="w-64 pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent bg-white"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-medium">⌘K</kbd>
            </div>
            {/* Upload button */}
            <Link
              href="/files"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-[#2563eb]/20"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Link>
            {/* Notification */}
            <button className="relative p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors bg-white">
              <Bell className="h-4 w-4 text-gray-500" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#ef4444] rounded-full" />
            </button>
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-[#2563eb] flex items-center justify-center flex-shrink-0 cursor-pointer">
              <span className="text-sm font-semibold text-white">
                {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <span className="text-sm text-gray-500 font-medium">{card.label}</span>
              </div>
              <p className="text-3xl font-bold text-[#0f172a]">{card.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.suffix}</p>
            </div>
          ))}
        </div>

        {/* Recent Files */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
            <h2 className="font-semibold text-[#0f172a]">Recent Files</h2>
            <Link href="/files" className="text-sm font-medium text-[#2563eb] hover:underline">
              View all
            </Link>
          </div>
          <div className="p-4">
            {recentFiles.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {recentFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-[#2563eb]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FolderOpen className="h-4 w-4 text-[#2563eb]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0f172a] truncate">
                          {file.originalName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatFileSize(Number(file.size))} &middot; {formatDate(file.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/files"
                      className="text-xs font-medium text-[#2563eb] hover:underline flex-shrink-0 ml-4"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#2563eb]/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#2563eb]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <p className="font-medium text-[#0f172a] mb-1">No files yet</p>
                <p className="text-sm text-gray-400 mb-4">
                  Upload your first file to get started.
                </p>
                <Link
                  href="/files"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                  <Upload className="h-4 w-4" />
                  Upload File
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Download History */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-[#7c3aed]" />
              <h2 className="font-semibold text-[#0f172a]">Download History</h2>
            </div>
            {downloadHistory.length > 0 && (
              <span className="text-xs text-gray-400">{downloadHistory.length} downloads</span>
            )}
          </div>
          <div className="p-4">
            {downloadHistory.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {downloadHistory.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-[#7c3aed]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Download className="h-4 w-4 text-[#7c3aed]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0f172a] truncate">
                          {item.fileName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatFileSize(item.fileSize)} &middot; {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0 ml-4">
                      <Clock className="h-3 w-3" />
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Download className="h-6 w-6 text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">
                  No downloads yet
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  Download history will appear here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* How it works */}
        <div>
          <h2 className="text-lg font-semibold text-[#0f172a] mb-4">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="w-11 h-11 bg-[#2563eb]/10 rounded-xl flex items-center justify-center mb-3">
                <Cloud className="h-5 w-5 text-[#2563eb]" />
              </div>
              <h3 className="font-semibold text-[#0f172a] mb-1">Upload</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Upload any file you want securely to CloudShare.
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="w-11 h-11 bg-[#7c3aed]/10 rounded-xl flex items-center justify-center mb-3">
                <Link2 className="h-5 w-5 text-[#7c3aed]" />
              </div>
              <h3 className="font-semibold text-[#0f172a] mb-1">Share</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Generate a secure link and share with others.
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="w-11 h-11 bg-[#10b981]/10 rounded-xl flex items-center justify-center mb-3">
                <Shield className="h-5 w-5 text-[#10b981]" />
              </div>
              <h3 className="font-semibold text-[#0f172a] mb-1">Protect</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Add an optional PIN for extra security and privacy.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-full xl:w-[300px] flex-shrink-0 space-y-5">
        {/* Quick Upload */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-[#0f172a] mb-3">Quick Upload</h3>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#2563eb]/40 hover:bg-[#2563eb]/[0.02] transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={() => fileInputRef.current?.form?.requestSubmit()}
            />
            <UploadCloud className="h-10 w-10 text-[#2563eb] mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">
              Drag & drop files here
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              or <span className="text-[#2563eb] font-medium">click to browse</span>
            </p>
            <p className="text-[10px] text-gray-400 mt-2">
              Maximum file size: 5 GB
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#0f172a]">Recent Activity</h3>
            <Link href="/shared" className="text-xs font-medium text-[#2563eb] hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activity.color}`}>
                  <activity.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0f172a]">{activity.text}</p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-[#0f172a] mb-3">Security</h3>
          <div className="bg-[#2563eb]/5 rounded-xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 bg-[#2563eb]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-[#2563eb]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0f172a]">Your files are secure</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                All files are encrypted and protected with industry-standard security.
              </p>
            </div>
          </div>
        </div>

        {/* Need Help */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-[#0f172a] mb-2">Need help?</h3>
          <p className="text-sm text-gray-500 mb-3">
            Check out our documentation or contact support.
          </p>
          <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-[#0f172a] hover:bg-gray-50 transition-colors">
            Get Help
          </button>
        </div>
      </div>
    </div>
  );
}

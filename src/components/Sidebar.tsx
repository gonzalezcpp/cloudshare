'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  FolderOpen,
  Share2,
  Settings,
  LogOut,
  Menu,
  X,
  Clock,
  Trash2,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { formatFileSize } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Files', href: '/files', icon: FolderOpen },
  { name: 'Shared Links', href: '/shared', icon: Share2 },
  { name: 'Activity', href: '/activity', icon: Clock },
  { name: 'Trash', href: '/trash', icon: Trash2 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  storageUsed?: number;
  storageLimit?: number;
}

export function Sidebar({ storageUsed = 0, storageLimit = 10737418240 }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const storagePercent = Math.min((Number(storageUsed) / Number(storageLimit)) * 100, 100);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-sm border border-gray-200"
      >
        <Menu className="h-5 w-5 text-gray-600" />
      </button>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-[240px] bg-white border-r border-gray-100 z-50 flex flex-col transform transition-transform duration-200',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16">
          <Link href="/dashboard">
            <BrandLogo size="md" />
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href && (
              item.name === 'Dashboard' ? pathname === '/dashboard' : true
            );
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-[#2563eb] text-white shadow-sm shadow-[#2563eb]/20'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Storage & User */}
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* Storage */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-500">Storage Used</span>
            </div>
            <p className="text-xs text-gray-400 mb-2">
              {formatFileSize(Number(storageUsed))} of {formatFileSize(Number(storageLimit))}
            </p>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2563eb] rounded-full transition-all duration-300"
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            <p className="text-right text-[10px] text-[#2563eb] font-medium mt-1">
              {storagePercent.toFixed(0)}%
            </p>
          </div>

          {/* Upgrade */}
          <Link
            href="/pricing"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Crown className="h-4 w-4 text-[#f59e0b]" />
            Upgrade Storage
          </Link>

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#2563eb] flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-white">
                {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {session?.user?.email || ''}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

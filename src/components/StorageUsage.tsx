'use client';

import { formatFileSize } from '@/lib/utils';
import { HardDrive } from 'lucide-react';

interface StorageUsageProps {
  used: number;
  limit: number;
}

export function StorageUsage({ used, limit }: StorageUsageProps) {
  const percentage = Math.min((Number(used) / Number(limit)) * 100, 100);
  const isWarning = percentage > 80;
  const isDanger = percentage > 90;

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Storage
          </span>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatFileSize(Number(used))} / {formatFileSize(Number(limit))}
        </span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isDanger
              ? 'bg-red-500'
              : isWarning
              ? 'bg-yellow-500'
              : 'bg-brand-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {percentage.toFixed(1)}% used
      </p>
    </div>
  );
}

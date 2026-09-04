'use client';

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { SortField, SortDirection } from '@/types';

interface SortSelectProps {
  sort: SortField;
  direction: SortDirection;
  onSortChange: (sort: SortField, direction: SortDirection) => void;
}

const sortOptions: { value: SortField; label: string }[] = [
  { value: 'filename', label: 'Name' },
  { value: 'size', label: 'Size' },
  { value: 'createdAt', label: 'Date' },
  { value: 'downloadCount', label: 'Downloads' },
];

export function SortSelect({ sort, direction, onSortChange }: SortSelectProps) {
  const toggleDirection = () => {
    onSortChange(sort, direction === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortField, direction)}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        onClick={toggleDirection}
        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        {direction === 'asc' ? (
          <ArrowUp className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        ) : (
          <ArrowDown className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        )}
      </button>
    </div>
  );
}

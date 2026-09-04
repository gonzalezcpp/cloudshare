'use client';

import { useEffect, useState } from 'react';
import { ShareLinkWithFile } from '@/types';
import { formatDate, formatFileSize } from '@/lib/utils';
import { Copy, ExternalLink, Shield, ShieldOff, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SharedPage() {
  const [sharedLinks, setSharedLinks] = useState<ShareLinkWithFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSharedLinks();
  }, []);

  const fetchSharedLinks = async () => {
    try {
      const response = await fetch('/api/share');
      const data = await response.json();
      if (data.success) {
        setSharedLinks(data.data);
      }
    } catch (error) {
      toast.error('Failed to load shared links');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/d/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this share link?')) {
      return;
    }

    try {
      const response = await fetch(`/api/share/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Share link deleted');
        fetchSharedLinks();
      } else {
        toast.error(data.error || 'Failed to delete share link');
      }
    } catch (error) {
      toast.error('Failed to delete share link');
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Shared Links
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your shared files and links
        </p>
      </div>

      {sharedLinks.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                    File
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                    Downloads
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                    PIN
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sharedLinks.map((link) => (
                  <tr
                    key={link.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">📁</div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {link.file.originalName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            /d/{link.shareToken}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatFileSize(Number(link.file.size))}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {link.downloadCount}
                    </td>
                    <td className="px-4 py-3">
                      {link.pinProtected ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                          <Shield className="h-3 w-3" />
                          Protected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">
                          <ShieldOff className="h-3 w-3" />
                          Open
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(link.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCopyLink(link.shareToken)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          title="Copy link"
                        >
                          <Copy className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </button>
                        <a
                          href={`/d/${link.shareToken}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          title="Open link"
                        >
                          <ExternalLink className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </a>
                        <button
                          onClick={() => handleDelete(link.id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                          title="Delete link"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <ExternalLink className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No shared links yet. Share a file to get started!
          </p>
        </div>
      )}
    </div>
  );
}

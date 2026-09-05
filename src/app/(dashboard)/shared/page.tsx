'use client';

import { useEffect, useState } from 'react';
import { ShareLinkWithDetails } from '@/types';
import { formatDate, formatFileSize } from '@/lib/utils';
import { Copy, ExternalLink, Shield, ShieldOff, Trash2, Folder, File } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SharedPage() {
  const [sharedLinks, setSharedLinks] = useState<ShareLinkWithDetails[]>([]);
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

  const getDisplayName = (link: ShareLinkWithDetails) => {
    if (link.file) return link.file.originalName;
    if (link.folder) return link.folder.name;
    return 'Unknown';
  };

  const getDisplaySize = (link: ShareLinkWithDetails) => {
    if (link.file) return formatFileSize(Number(link.file.size));
    if (link.folder) return `${link.folder.files.length} files`;
    return '—';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#2563eb]/20 border-t-[#2563eb]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a]">
          Shared Links
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Manage your shared files and folders
        </p>
      </div>

      {sharedLinks.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Item
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Downloads
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    PIN
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sharedLinks.map((link) => (
                  <tr
                    key={link.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 ${link.folder ? 'bg-[#7c3aed]/10' : 'bg-[#2563eb]/10'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          {link.folder ? (
                            <Folder className="h-4 w-4 text-[#7c3aed]" />
                          ) : (
                            <File className="h-4 w-4 text-[#2563eb]" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[#0f172a] text-sm">
                            {getDisplayName(link)}
                          </p>
                          <p className="text-xs text-gray-400">
                            /d/{link.shareToken}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {getDisplaySize(link)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {link.downloadCount}
                    </td>
                    <td className="px-4 py-3">
                      {link.folder ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#7c3aed]/10 text-[#7c3aed] text-xs font-medium rounded-full">
                          <Folder className="h-3 w-3" />
                          Folder
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#2563eb]/10 text-[#2563eb] text-xs font-medium rounded-full">
                          <File className="h-3 w-3" />
                          File
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {link.pinProtected ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#2563eb]/10 text-[#2563eb] text-xs font-medium rounded-full">
                          <Shield className="h-3 w-3" />
                          Protected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                          <ShieldOff className="h-3 w-3" />
                          Open
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(link.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleCopyLink(link.shareToken)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Copy link"
                        >
                          <Copy className="h-4 w-4 text-gray-400 hover:text-[#2563eb]" />
                        </button>
                        <a
                          href={`/d/${link.shareToken}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Open link"
                        >
                          <ExternalLink className="h-4 w-4 text-gray-400 hover:text-[#2563eb]" />
                        </a>
                        <button
                          onClick={() => handleDelete(link.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete link"
                        >
                          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
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
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">
            No shared links yet
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Share a file or folder to get started
          </p>
        </div>
      )}
    </div>
  );
}
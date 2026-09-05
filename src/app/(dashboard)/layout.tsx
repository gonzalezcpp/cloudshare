'use client';

import { Sidebar } from '@/components/Sidebar';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [storage, setStorage] = useState({ used: 0, limit: 10737418240 });

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStorage({
            used: Number(data.data.stats.storageUsed || 0),
            limit: Number(data.data.stats.storageLimit || 10737418240),
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar storageUsed={storage.used} storageLimit={storage.limit} />
      <main className="lg:ml-[240px] min-h-screen">
        <div className="p-5 lg:p-6">{children}</div>
      </main>
    </div>
  );
}

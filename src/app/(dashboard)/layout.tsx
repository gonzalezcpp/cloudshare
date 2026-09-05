'use client';

import { Sidebar } from '@/components/Sidebar';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { pingDeviceInfo } from '@/lib/deviceInfo';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [storage, setStorage] = useState({ used: 0, limit: 10737418240 });
  const { data: session, status } = useSession();
  const router = useRouter();
  const devicePinged = useRef(false);

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.needsOnboarding) {
      router.push('/welcome');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && !devicePinged.current) {
      devicePinged.current = true;
      pingDeviceInfo();
    }
  }, [status]);

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

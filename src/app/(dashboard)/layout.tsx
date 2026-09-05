import { Sidebar } from '@/components/Sidebar';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="lg:ml-[260px] min-h-screen">
        <div className="p-5 lg:p-8 max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

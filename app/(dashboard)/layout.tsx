import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#0f172a]">
      <Sidebar />
      <main className="ml-64 flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
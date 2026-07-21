import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <main className="flex-1 min-h-screen w-full md:ml-64">
        {/* Increased top padding for better spacing */}
        <div className="p-4 sm:p-6 md:p-8 pt-8 sm:pt-10 md:pt-12">
          {children}
        </div>
      </main>
    </div>
  );
}
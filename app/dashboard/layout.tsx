import { Sidebar } from '@/components/layout/Sidebar';
import { MOCK_USER } from '@/lib/mockData';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar user={MOCK_USER} />
      <main className="ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}

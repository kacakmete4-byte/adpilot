import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { authOptions } from '@/lib/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="min-h-screen pb-20 md:pb-0 md:ml-64">
        {children}
      </main>
    </div>
  );
}

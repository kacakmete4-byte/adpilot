import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

  if (!email) {
    redirect('/login');
  }

  if (!adminEmail || email !== adminEmail) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}

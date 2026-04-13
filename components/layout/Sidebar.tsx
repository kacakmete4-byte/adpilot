'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  PlusCircle,
  BarChart2,
  Settings,
  MessageSquareWarning,
  Zap,
  LogOut,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/create-ad', label: 'Reklam', icon: PlusCircle },
  { href: '/dashboard/reports', label: 'Raporlar', icon: BarChart2 },
  { href: '/dashboard/support', label: 'Iletisim', icon: MessageSquareWarning },
  { href: '/dashboard/settings', label: 'Ayarlar', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name || 'Kullanici';
  const userEmail = session?.user?.email || '';

  return (
    <>
      <aside className='hidden md:flex fixed inset-y-0 left-0 w-64 bg-slate-900 flex-col z-50'>
        <div className='flex items-center gap-3 px-6 py-5 border-b border-slate-800'>
          <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
            <Zap className='w-4 h-4 text-white' />
          </div>
          <div>
            <span className='font-bold text-white text-base tracking-tight'>Advara</span>
            <p className='text-slate-500 text-xs'>AI Reklam Yonetimi</p>
          </div>
        </div>

        <nav className='flex-1 px-4 py-6 space-y-1'>
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                )}
              >
                <Icon className='w-4 h-4 flex-shrink-0' />
                {label}
                {isActive && <ChevronRight className='w-3 h-3 ml-auto opacity-60' />}
              </Link>
            );
          })}
        </nav>

        <div className='px-4 pb-2'>
          <div className='bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-4'>
            <p className='text-white text-xs font-semibold mb-1'>Starter Plan</p>
            <p className='text-blue-200 text-xs'>Aylik 5 kampanya hakkin var</p>
            <div className='mt-2 bg-blue-500/40 rounded-full h-1.5'>
              <div className='bg-white rounded-full h-1.5 w-3/5' />
            </div>
            <p className='text-blue-200 text-xs mt-1'>3 / 5 kullanildi</p>
          </div>
        </div>

        <div className='px-4 pb-5 pt-2 border-t border-slate-800'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0'>
              {userName.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-white text-xs font-medium truncate'>{userName}</p>
              <p className='text-slate-500 text-xs truncate'>{userEmail}</p>
            </div>
            <Link href='/login' className='text-slate-500 hover:text-slate-300 transition-colors'>
              <LogOut className='w-4 h-4' />
            </Link>
          </div>
        </div>
      </aside>

      <nav className='md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur px-2 py-1.5'>
        <div className='grid grid-cols-5 gap-1'>
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex flex-col items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-medium',
                  isActive ? 'text-blue-600 bg-blue-50' : 'text-slate-500'
                )}
              >
                <Icon className='w-4 h-4' />
                <span className='truncate max-w-full'>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

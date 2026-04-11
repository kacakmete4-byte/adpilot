'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  LayoutDashboard,
  PlusCircle,
  BarChart2,
  Settings,
  Zap,
  LogOut,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/create-ad', label: 'Reklam Oluştur', icon: PlusCircle },
  { href: '/dashboard/reports', label: 'Raporlar', icon: BarChart2 },
  { href: '/dashboard/settings', label: 'Ayarlar', icon: Settings },
];

interface SidebarProps {
  user?: { name: string; email: string; plan: string };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-white text-base tracking-tight">AdPanel</span>
          <p className="text-slate-500 text-xs">AI Reklam Yönetimi</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Plan Badge */}
      <div className="px-4 pb-2">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-4">
          <p className="text-white text-xs font-semibold mb-1">Starter Plan</p>
          <p className="text-blue-200 text-xs">Aylık 5 kampanya hakkın var</p>
          <div className="mt-2 bg-blue-500/40 rounded-full h-1.5">
            <div className="bg-white rounded-full h-1.5 w-3/5" />
          </div>
          <p className="text-blue-200 text-xs mt-1">3 / 5 kullanıldı</p>
        </div>
      </div>

      {/* User */}
      <div className="px-4 pb-5 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.name || 'Kullanıcı'}</p>
            <p className="text-slate-500 text-xs truncate">{user?.email || ''}</p>
          </div>
          <Link href="/login" className="text-slate-500 hover:text-slate-300 transition-colors">
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}

'use client';

import { Bell, Search } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Header({ title, subtitle, action }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4 gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {action && action}
          <button className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
          </button>
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Ara..."
              className="pl-9 pr-4 py-2 text-sm bg-slate-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 placeholder-slate-400"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

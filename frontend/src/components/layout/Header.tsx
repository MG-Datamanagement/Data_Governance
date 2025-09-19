'use client';

import { Search, Settings, User, Bell } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import Link from 'next/link';
import Image from 'next/image';

export function Header() {
  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200/60 dark:border-slate-700/60 sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="h-12 w-12 relative">
                <Image
                  src="/logo.png"
                  alt="Infinity Governance Logo"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                Infinity Governance
              </div>
            </Link>
          </div>
          
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tables, datasets, tags..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200/60 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
              <Bell className="w-5 h-5" />
            </button>
            <ThemeToggle />
            <button className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
              <User className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Database,
  Tag,
  Folder,
  BarChart3,
  FileText,
  Home,
  Building2,
  ShieldCheck,
  Star,
  GitBranch
} from 'lucide-react';
import { clsx } from 'clsx';

const navigationItems = [
  {
    name: 'Overview',
    href: '/',
    icon: Home,
    implemented: true,
  },
  {
    name: 'Data Catalog',
    href: '/catalog',
    icon: Database,
    implemented: true,
  },
  {
    name: 'Data Quality',
    href: '/quality',
    icon: BarChart3,
    implemented: true,
  },
  {
    name: 'Data Lineage',
    href: '/lineage',
    icon: GitBranch,
    implemented: true,
  },
  {
    name: 'Governance',
    href: '/governance',
    icon: ShieldCheck,
    implemented: true,
  },
  {
    name: 'Data Sources',
    href: '/data-sources',
    icon: Building2,
    implemented: true,
  },
  {
    name: 'Domains',
    href: '/domains',
    icon: Folder,
    implemented: true,
  },
  {
    name: 'Favorites',
    href: '/favorites',
    icon: Star,
    implemented: true,
  },
  {
    name: 'Tags',
    href: '/tags',
    icon: Tag,
    implemented: true,
  },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:block fixed top-20 left-0 bottom-0 w-64 bg-white dark:bg-slate-800 z-40 border-r border-slate-200/60 dark:border-slate-700/60 shadow-sm">
      <div className="p-4 h-full overflow-auto">
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Navigation</h2>
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const isImplemented = item.implemented;

            const linkContent = (
              <>
                <item.icon
                  className={clsx(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    !isImplemented
                      ? 'text-slate-300 dark:text-slate-600'
                      : isActive
                        ? 'text-white'
                        : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400'
                  )}
                />
                <span className={clsx(!isImplemented && 'relative')}>
                  {item.name}
                  {!isImplemented && (
                    <span className="ml-2 text-xs text-slate-400 dark:text-slate-500"></span>
                  )}
                </span>
              </>
            );

            return (
              <li key={item.name}>
                {isImplemented ? (
                  <Link
                    href={item.href as any}
                    className={clsx(
                      'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-md'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                    )}
                  >
                    <item.icon
                      className={clsx(
                        'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                        isActive
                          ? 'text-white'
                          : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400'
                      )}
                    />
                    <span className="font-medium">{item.name}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </Link>
                ) : (
                  <div
                    className="flex items-center px-4 py-3 text-sm font-medium rounded-xl cursor-not-allowed text-slate-400 dark:text-slate-600 opacity-60"
                    title="Feature coming soon"
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    <span>{item.name}</span>
                    <span className="ml-auto text-xs bg-slate-200/60 dark:bg-slate-600/60 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full">
                      Soon
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
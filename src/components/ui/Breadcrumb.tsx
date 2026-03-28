import React from 'react';
import Link from 'next/link';
import { Home, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  /** Display label for this segment */
  label: string;
  /** If provided, the segment is a navigable link */
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Standardized breadcrumb used across all module pages.
 *
 * Usage:
 * ```tsx
 * <Breadcrumb items={[
 *   { label: 'Home', href: '/' },
 *   { label: 'Governance' },
 *   { label: 'Tags' },        // last item = current page, never linked
 * ]} />
 * ```
 *
 * Rules:
 * - First item always receives the Home icon next to its label.
 * - Last item is always rendered as plain text (current page, non-linked).
 * - Middle items are linked if `href` is provided, plain text otherwise.
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1.5 text-sm text-gray-500 mb-6', className)}
    >
      {items.map((item, index) => {
        const isFirst = index === 0;
        const isLast = index === items.length - 1;

        const label = (
          <span className="flex items-center gap-1">
            {isFirst && <Home className="w-3.5 h-3.5 flex-shrink-0" />}
            {item.label}
          </span>
        );

        return (
          <React.Fragment key={index}>
            {/* Separator (not before the first item) */}
            {index > 0 && (
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" aria-hidden="true" />
            )}

            {/* Current page — non-interactive */}
            {isLast ? (
              <span className="font-semibold text-gray-900" aria-current="page">
                {label}
              </span>
            ) : item.href ? (
              /* Linked ancestor */
              <Link
                href={item.href}
                className="hover:text-gray-700 transition-colors"
              >
                {label}
              </Link>
            ) : (
              /* Non-linked ancestor (e.g. "Governance" section label) */
              <span className="text-gray-400">{label}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

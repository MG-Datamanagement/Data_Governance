import React from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  badgeCount?: number | string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  badgeCount,
  headerAction,
  children,
  className,
}: SectionCardProps) {
  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden", className)}>
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
        <div className="flex items-center gap-2">
          <h2 className="text-md font-bold text-gray-900">{title}</h2>
          {badgeCount !== undefined && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-bold border border-indigo-100">
              {badgeCount}
            </span>
          )}
        </div>
        {headerAction && (
          <div className="flex items-center gap-2">
            {headerAction}
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

import React from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title?: string;
  description?: React.ReactNode;
  headerIcon?: React.ReactNode;
  badgeCount?: number | string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  showSectionHeader?: boolean;
  infotext?: string;
}

export function SectionCard({
  title,
  description,
  headerIcon,
  badgeCount,
  headerAction,
  children,
  className,
  bodyClassName,
  showSectionHeader = true,
  infotext,
}: SectionCardProps) {
  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden", className)}>
      {showSectionHeader && <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            {headerIcon && (
              <div className="text-indigo-600">{headerIcon}</div>
            )}
            <h2 className="text-md font-bold text-gray-900">{title}</h2>
            {badgeCount !== undefined && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-gray-600 text-[11px] font-semibold border border-gray-100">
                {badgeCount}
              </span>
            )}
          </div>
          {description && (
            <div className="text-xs text-gray-500 font-medium">{description}</div>
          )}
        </div>
        {headerAction && (
          <div className="flex items-center gap-2">
            {headerAction}
          </div>
        )}
        {
          infotext && (
            <div className="text-xs text-gray-500 font-medium">{infotext}</div>
          )
        }
      </div>}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

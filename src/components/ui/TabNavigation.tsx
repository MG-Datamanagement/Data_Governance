"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  name: React.ReactNode;
  href?: string;
}

export interface TabNavigationProps {
  tabs: TabItem[];
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  rightAction?: React.ReactNode;
  className?: string;
  tabClassName?: string;
}

export function TabNavigation({
  tabs,
  activeTabId,
  onTabChange,
  rightAction,
  className,
  tabClassName,
}: TabNavigationProps) {
  return (
    <div className={cn("border-b border-gray-200 px-0 flex items-center justify-between mb-2", className)}>
      <nav className="flex gap-5">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const content = (
            <span
              className={cn(
                "pb-3 px-1 text-sm font-medium transition-colors border-b-2 block",
                isActive
                  ? "text-primary border-primary font-bold"
                  : "text-gray-500 border-transparent hover:text-gray-900",
                tabClassName
              )}
            >
              {tab.name}
            </span>
          );

          if (tab.href) {
            return (
              <Link key={tab.id} href={tab.href}>
                {content}
              </Link>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className="focus:outline-none"
            >
              {content}
            </button>
          );
        })}
      </nav>
      {rightAction && (
        <div className="flex items-center gap-2 pb-1">
          {rightAction}
        </div>
      )}
    </div>
  );
}

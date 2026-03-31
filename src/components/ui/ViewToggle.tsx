"use client";

import React from "react";
import { List, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "list" | "grid";

interface ViewToggleProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
  className?: string;
  size?: "sm" | "md";
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  view,
  onChange,
  className,
  size = "md",
}) => {
  const iconSize = size === "sm" ? 14 : 16;

  return (
    <div
      className={cn(
        "flex items-center border border-gray-200 rounded-lg p-0.5 bg-gray-50 shadow-sm",
        className
      )}
    >
      <button
        onClick={() => onChange("list")}
        className={cn(
          "p-1.5 rounded-md transition-all duration-200",
          view === "list"
            ? "bg-white shadow-sm text-indigo-600 font-bold"
            : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        )}
        title="List view"
        aria-label="List view"
        aria-pressed={view === "list"}
      >
        <List style={{ width: iconSize, height: iconSize }} />
      </button>
      <button
        onClick={() => onChange("grid")}
        className={cn(
          "p-1.5 rounded-md transition-all duration-200",
          view === "grid"
            ? "bg-white shadow-sm text-indigo-600 font-bold"
            : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        )}
        title="Grid view"
        aria-label="Grid view"
        aria-pressed={view === "grid"}
      >
        <LayoutGrid style={{ width: iconSize, height: iconSize }} />
      </button>
    </div>
  );
};

import React from "react";
import { Loader2 } from "lucide-react";
import { InlineState } from "@/components/ui/InlineState";
import { cn } from "@/lib/utils";

export interface DataGridColumn<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  width?: string | number;
}

export interface DataGridProps<T> {
  data: T[];
  columns: DataGridColumn<T>[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyStateMessage?: string;
  emptyStateIcon?: React.ReactNode;
  keyExtractor: (row: T) => string | number;
  density?: "compact" | "normal";
  pagination?: React.ReactNode;
  className?: string;
}

export function DataGrid<T>({
  data,
  columns,
  onRowClick,
  isLoading,
  emptyStateMessage = "No data found",
  emptyStateIcon,
  keyExtractor,
  density = "normal",
  pagination,
  className,
}: DataGridProps<T>) {
  const cellPadding = density === "compact" ? "px-4 py-2.5 text-[13px]" : "px-6 py-4 text-sm text-gray-700";
  const headerPadding = density === "compact" ? "px-4 py-2.5 text-[11px]" : "px-6 py-3.5 text-xs text-gray-500";

  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden w-full flex flex-col", className)}>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left">
          <thead className="bg-gray-50/80 border-b border-gray-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn(
                    "font-bold uppercase tracking-wider whitespace-nowrap",
                    headerPadding,
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length}>
                  <InlineState type="loading" message="Loading data..." />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 text-gray-400">
                    {emptyStateIcon}
                    <p className="text-sm font-medium">{emptyStateMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    "transition-colors group",
                    onRowClick ? "cursor-pointer hover:bg-gray-50/80" : "hover:bg-gray-50/40"
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "whitespace-nowrap transition-colors",
                        cellPadding,
                        col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                      )}
                    >
                      {col.render ? col.render(row) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div className="border-t border-gray-200 bg-gray-50/50 px-2">
          {pagination}
        </div>
      )}
    </div>
  );
}

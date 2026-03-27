import React from "react";
import { Loader2 } from "lucide-react";

export interface DataGridColumn<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
}

export interface DataGridProps<T> {
  data: T[];
  columns: DataGridColumn<T>[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyStateMessage?: string;
  emptyStateIcon?: React.ReactNode;
  keyExtractor: (row: T) => string | number;
}

export function DataGrid<T>({
  data,
  columns,
  onRowClick,
  isLoading,
  emptyStateMessage = "No data found",
  emptyStateIcon,
  keyExtractor,
}: DataGridProps<T>) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden w-full overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50/50 border-b border-gray-200">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs ${
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                    ? "text-center"
                    : "text-left"
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="py-16 text-center">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500/50" />
                  <p className="text-sm">Loading data...</p>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-16 text-center">
                <div className="flex flex-col items-center justify-center gap-3 text-gray-400">
                  {emptyStateIcon}
                  <p className="text-sm">{emptyStateMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick && onRowClick(row)}
                className={`hover:bg-gray-50/50 transition-colors ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-6 py-4 whitespace-nowrap ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                        ? "text-center"
                        : "text-left"
                    }`}
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
  );
}

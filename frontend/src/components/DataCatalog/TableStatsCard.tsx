import { Loader2 } from "lucide-react";
import React from "react";

export interface TableStats {
  table_id: number;
  row_count: number | null;
  size_bytes: number | null;
  quality_score: number | null;
  query_count_last_30d: number | null;
  unique_users_last_30d: number | null;
  last_updated: string | null;
}

interface TableStatsCardProps {
  data: TableStats;
  isLoading: boolean;
}

const TableStatsCard: React.FC<TableStatsCardProps> = ({
  data,
  isLoading,
}: TableStatsCardProps) => {
  const {
    table_id,
    row_count,
    size_bytes,
    quality_score,
    query_count_last_30d,
    unique_users_last_30d,
    last_updated,
  } = data;

  // Converting bytes to readable format
  const formatSize = (bytes: number | null): string => {
    if (!bytes) return "—";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return isLoading ? (
    <div className="w-full flex justify-center">
      <Loader2 className="animate-spin text-[#3B82F6] w-10 h-10" />
    </div>
  ) : (
    <div className="w-full bg-white py-2 space-y-4 dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition">
      <div className="flex justify-evenly gap-10 items-center mb-3 p-2 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Table ID#{table_id}
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatDate(last_updated)}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <div className="flex flex-col">
          <span className="text-gray-500 dark:text-gray-400">Rows</span>
          <span className="font-medium text-gray-800 dark:text-gray-100">
            {row_count?.toLocaleString() ?? "—"}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-gray-500 dark:text-gray-400">Size</span>
          <span className="font-medium text-gray-800 dark:text-gray-100">
            {formatSize(size_bytes)}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-gray-500 dark:text-gray-400">Quality</span>
          <span className="font-medium text-gray-800 dark:text-gray-100">
            {quality_score ?? "—"}/100
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-gray-500 dark:text-gray-400">
            Queries (30d)
          </span>
          <span className="font-medium text-gray-800 dark:text-gray-100">
            {query_count_last_30d ?? "—"}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-gray-500 dark:text-gray-400">Users (30d)</span>
          <span className="font-medium text-gray-800 dark:text-gray-100">
            {unique_users_last_30d ?? "—"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TableStatsCard;

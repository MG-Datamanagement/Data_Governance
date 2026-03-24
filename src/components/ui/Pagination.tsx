import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemName?: string;
  totalItems?: number;
  itemsPerPage?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemName = "items",
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  if (totalPages <= 1 && !totalItems) return null;

  const startItem = totalItems && itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : undefined;
  const endItem = totalItems && itemsPerPage ? Math.min(currentPage * itemsPerPage, totalItems) : undefined;

  return (
    <div className="px-5 py-3.5 bg-white border-none flex items-center justify-between">
      <span className="text-[13px] text-gray-500 font-medium">
        {totalItems !== undefined && itemsPerPage !== undefined ? (
          <>
            Showing {startItem} to {endItem} of {totalItems} {itemName}
          </>
        ) : (
          <>Showing {itemName}K</>
        )}
      </span>
      <div className="flex items-center gap-1.5 text-[13px] text-gray-700 font-medium border border-gray-200 rounded-lg p-1 px-1.5 shadow-sm">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2} />
        </button>
        <span className="px-2 text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= Math.max(1, totalPages)}
          className="p-1 text-gray-800 hover:text-black disabled:opacity-50 transition-colors"
        >
          <ChevronRight className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

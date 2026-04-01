import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";
import { Select } from "./Select";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  /** Total number of pages. Can be calculated from totalItems + pageSize. */
  totalPages?: number;
  /** Total number of items — used with pageSize to calculate totalPages */
  totalItems?: number;
  /** Items per page — used with totalItems to calculate totalPages */
  pageSize?: number;
  /** Available page size options */
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange?: (size: number) => void;
  /** Show "Showing X–Y of Z items" label */
  showCount?: boolean;
  /** Compact mode: smaller text and tighter layout */
  compact?: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages: totalPagesProp,
  totalItems,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  showCount = false,
  compact = true,
  className,
}: PaginationProps) {
  const totalPages =
    totalPagesProp ??
    (totalItems != null && pageSize ? Math.max(1, Math.ceil(totalItems / pageSize)) : 1);

  if (totalPages <= 1 && !showCount) return null;

  const start = totalItems != null && pageSize ? (currentPage - 1) * pageSize + 1 : null;
  const end =
    totalItems != null && pageSize
      ? Math.min(currentPage * pageSize, totalItems)
      : null;

  return (
    <div
      className={cn(
        "flex items-center justify-between",
        compact ? "px-2 py-3" : "px-4 py-5",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        {/* Count label */}
        {showCount && totalItems != null ? (
          <span className={cn("text-gray-500", compact ? "text-xs" : "text-sm")}>
            {start != null && end != null ? (
              <>
                Showing{" "}
                <span className="font-semibold text-gray-800">{start}–{end}</span> of{" "}
                <span className="font-semibold text-gray-800">{totalItems}</span> items
              </>
            ) : (
              <>
                Page{" "}
                <span className="font-semibold text-gray-800">{currentPage}</span> of{" "}
                <span className="font-semibold text-gray-800">{totalPages}</span>
              </>
            )}
          </span>
        ) : (
          <span className={cn("text-gray-500", compact ? "text-xs" : "text-sm")}>
            Page <span className="font-semibold text-gray-800">{currentPage}</span> of{" "}
            <span className="font-semibold text-gray-800">{totalPages}</span>
          </span>
        )}

        {/* Page Size Selector */}
        {pageSizeOptions && onPageSizeChange && pageSize != null && (
          <div className="flex items-center gap-2">
            <div className={cn("text-gray-500", compact ? "text-xs" : "text-sm")}>Rows per page:</div>
            <Select
              value={pageSize.toString()}
              onChange={(val) => onPageSizeChange(Number(val))}
              options={pageSizeOptions.map((size) => ({
                value: size.toString(),
                label: size.toString(),
              }))}
              className={compact ? "h-7 py-0.5 text-xs" : "h-8 py-1 text-sm"}
            />
          </div>
        )}
      </div>

      {/* Prev / Next */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size={compact ? "sm" : "sm"}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          icon={<ChevronLeft size={compact ? 14 : 16} />}
          aria-label="Previous Page"
        >
          {compact ? "" : "Previous"}
        </Button>

        {/* Page number pills (show up to 5 pages) */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {buildPageRange(currentPage, totalPages).map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-xs select-none">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p as number)}
                  aria-label={`Go to page ${p}`}
                  aria-current={p === currentPage ? "page" : undefined}
                  className={cn(
                    "w-7 h-7 rounded-md text-xs font-medium transition-colors",
                    p === currentPage
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100",
                  )}
                >
                  {p}
                </button>
              ),
            )}
          </div>
        )}

        <Button
          variant="outline"
          size={compact ? "sm" : "sm"}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          icon={<ChevronRight size={compact ? 14 : 16} />}
          className="flex-row-reverse"
          aria-label="Next Page"
        >
          {compact ? "" : "Next"}
        </Button>
      </div>
    </div>
  );
}

/** Build a compact page range with ellipsis, e.g. [1, '...', 4, 5, 6, '...', 20] */
function buildPageRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const range: (number | "...")[] = [];
  const delta = 1;
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  range.push(1);
  if (left > 2) range.push("...");
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push("...");
  range.push(total);
  return range;
}

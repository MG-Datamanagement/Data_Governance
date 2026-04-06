import React, { useState, useRef, useEffect } from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { Filter, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label?: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  width?: string;
  placeholder?: string;
}

export interface DataTableToolbarProps {
  search?: {
    value: string;
    onChange: (val: string) => void;
    onClear: () => void;
    placeholder?: string;
    className?: string;
  };
  filters?: FilterConfig[];
  actions?: React.ReactNode;
}

export function DataTableToolbar({
  search,
  filters,
  actions
}: DataTableToolbarProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(target) &&
        !target.closest('.z-\\[9999\\]')
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const hasActiveFilters = filters?.some(f => f.value && f.value !== "all");

  return (
    <div className={cn("flex flex-col sm:flex-row items-stretch sm:items-center gap-3", search ? "justify-between w-full" : "justify-end inline-flex")}>
      {search && (
        <div className="flex-1 w-full">
          <SearchInput
            value={search.value}
            onChange={search.onChange}
            onClear={search.onClear}
            placeholder={search.placeholder || "Search..."}
            className={search.className || "rounded-lg"}
          />
        </div>
      )}

      <div className="flex items-center gap-2 shrink-0">
        {filters && filters.length > 0 && (
          <div className="relative inline-block" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className={cn(
                "flex items-center gap-2 h-9 px-4 rounded-lg",
                "border border-gray-300 bg-white",
                "text-gray-700 font-medium text-sm",
                "hover:bg-gray-50 transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
              )}
            >
              <Filter size={14} className={hasActiveFilters ? "text-indigo-600" : "text-gray-500"} />
              Filters
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
              )}
              <ChevronDown
                size={14}
                className={cn("transition-transform ml-1 text-gray-400", open && "rotate-180")}
              />
            </button>

            {open && (
              <div 
                className={cn(
                  "absolute right-0 mt-2 w-72 max-w-[90vw]",
                  "rounded-xl border border-gray-100",
                  "bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)]",
                  "z-[50] p-4 animate-in fade-in zoom-in-95 duration-200"
                )}
              >
                <div className="flex items-center justify-end">
                   {/* <h4 className="font-semibold text-sm text-gray-900">Filters</h4> */}
                   {hasActiveFilters && (
                     <button 
                       onClick={() => {
                         filters.forEach(f => f.onChange("all"));
                       }} 
                       className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                     >
                       Clear all
                     </button>
                   )}
                </div>
                <div className="space-y-4">
                  {filters.map((filter) => (
                    <div key={filter.key} className="space-y-1.5">
                      {filter.label && (
                        <label className="text-xs font-medium text-gray-700 block">
                          {filter.label}
                        </label>
                      )}
                      <Select
                        size="md"
                        value={filter.value}
                        onChange={filter.onChange}
                        options={filter.options}
                        placeholder={filter.placeholder}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

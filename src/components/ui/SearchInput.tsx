import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  wrapperClassName?: string;
  showKbd?: boolean;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, onClear, showKbd, wrapperClassName, className, placeholder = "Search...", ...props }, ref) => {
    return (
      <div className={cn("relative w-full", wrapperClassName)}>
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Search
            className="w-4 h-4 text-gray-400 pointer-events-none"
            size={18}
          />
        </div>
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] transition-all",
            showKbd && "pr-16",
            className
          )}
          {...props}
        />
        {value && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={14} />
          </button>
        ) : showKbd ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            <kbd className="text-[10px] text-gray-400 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 font-sans">
              ⌘
            </kbd>
            <kbd className="text-[10px] text-gray-400 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 font-sans">
              K
            </kbd>
          </span>
        ) : null}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
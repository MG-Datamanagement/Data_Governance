import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
    label: string;
    value: string;
}

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'size'> {
    options?: SelectOption[];
    onChange?: (value: string) => void;
    placeholder?: string;
    size?: SelectSize;
}

const sizeStyles: Record<SelectSize, string> = {
    sm: "h-8 px-2.5 text-xs gap-1.5 rounded-lg",
    md: "h-9 px-3.5 text-sm gap-2 rounded-lg",
    lg: "h-11 px-5 text-sm rounded-xl font-bold",
};

const iconSizes: Record<SelectSize, number> = {
    sm: 14,
    md: 16,
    lg: 16,
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, options = [], value, onChange, placeholder = "Select...", disabled, size = 'md', ...props }, ref) => {
        const [isOpen, setIsOpen] = useState(false);
        const [openUpwards, setOpenUpwards] = useState(false);
        const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0, width: 0 });
        
        const containerRef = useRef<HTMLDivElement>(null);
        const triggerRef = useRef<HTMLButtonElement>(null);
        const selectRef = useRef<HTMLSelectElement>(null);

        // Sync with external ref for form library compatibility
        React.useImperativeHandle(ref, () => selectRef.current as HTMLSelectElement);

        const selectedOption = options.find(opt => opt.value === value);

        const updatePosition = useCallback(() => {
            if (!triggerRef.current) return;
            const rect = triggerRef.current.getBoundingClientRect();
            const dropdownHeight = Math.min(options.length * 40 + 12, 252);
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            const shouldOpenUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
            
            setOpenUpwards(shouldOpenUp);
            setMenuCoords({
                top: shouldOpenUp ? rect.top - 6 : rect.bottom + 6,
                left: rect.left,
                width: rect.width
            });
        }, [options.length]);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };

            if (isOpen) {
                updatePosition();
                document.addEventListener("mousedown", handleClickOutside);
                window.addEventListener("scroll", updatePosition, true);
                window.addEventListener("resize", updatePosition);
            }

            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
                window.removeEventListener("scroll", updatePosition, true);
                window.removeEventListener("resize", updatePosition);
            };
        }, [isOpen, updatePosition]);

        const handleSelect = (optionValue: string) => {
            if (disabled) return;
            onChange?.(optionValue);
            setIsOpen(false);
        };

        const handleToggle = () => {
            if (disabled) return;
            if (!isOpen) updatePosition();
            setIsOpen(!isOpen);
        };

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (disabled) return;
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleToggle();
            } else if (e.key === "Escape") {
                setIsOpen(false);
            }
        };

        return (
            <div className={cn("relative group inline-block w-full min-w-[80px]", className)} ref={containerRef}>
                {/* Hidden Select for accessibility & form compatibility */}
                <select
                    ref={selectRef}
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    className="sr-only"
                    disabled={disabled}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                {/* Custom Trigger */}
                <button
                    ref={triggerRef}
                    type="button"
                    onClick={handleToggle}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    className={cn(
                        "w-full flex items-center justify-between bg-white border border-gray-200 font-medium text-gray-900 appearance-none focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] cursor-pointer hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                        sizeStyles[size],
                        isOpen && "border-indigo-500 ring-4 ring-indigo-500/10"
                    )}
                >
                    <span className={cn("truncate flex-grow text-left", !selectedOption && "text-gray-400")}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronDown
                        size={iconSizes[size]}
                        className={cn(
                            "text-gray-400 transition-transform duration-200 flex-shrink-0",
                            isOpen && "rotate-180 text-indigo-500"
                        )}
                        strokeWidth={size === 'sm' ? 3 : 2.5}
                    />
                </button>

                {/* Dropdown Menu (Portal) */}
                {isOpen && typeof document !== "undefined" && createPortal(
                    <div 
                        className={cn(
                            "fixed bg-white border border-gray-100 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-200",
                            openUpwards ? "origin-bottom -translate-y-full" : "origin-top"
                        )}
                        style={{ 
                            top: menuCoords.top, 
                            left: menuCoords.left, 
                            width: menuCoords.width 
                        }}
                    >
                        <div className="p-1.5 max-h-60 overflow-y-auto custom-scrollbar">
                            {options.length > 0 ? (
                                options.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleSelect(option.value)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                            option.value === value
                                                ? "bg-indigo-50 text-indigo-700"
                                                : "text-gray-700 hover:bg-gray-50"
                                        )}
                                    >
                                        <span className="truncate">{option.label}</span>
                                        {option.value === value && (
                                            <Check size={14} className="text-indigo-600 shrink-0" strokeWidth={3} />
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="px-3 py-4 text-center text-xs text-gray-400 font-medium">
                                    No options available
                                </div>
                            )}
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        );
    }
);

Select.displayName = "Select";



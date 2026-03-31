import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
    label: string;
    value: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
    options?: SelectOption[];
    onChange?: (value: string) => void;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, options = [], value, onChange, ...props }, ref) => {
        return (
            <div className="relative group min-w-[120px]">
                <select
                    ref={ref}
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    className={cn(
                        "w-full pl-4 pr-10 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 appearance-none focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] cursor-pointer hover:border-gray-300 transition-all",
                        className
                    )}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                    {props.children}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors">
                    <ChevronDown size={16} strokeWidth={2.5} />
                </div>
            </div>
        );
    }
);

Select.displayName = "Select";

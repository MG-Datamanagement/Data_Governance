import React, { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ToggleSwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const ToggleSwitch = React.forwardRef<HTMLInputElement, ToggleSwitchProps>(
  ({ className, label, id, ...props }, ref) => {
    const defaultId = React.useId();
    const inputId = id || defaultId;

    return (
      <div className="flex items-center gap-3">
        <label htmlFor={inputId} className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            id={inputId}
            ref={ref}
            className="sr-only peer"
            {...props}
          />
          <div className={cn(
            "w-10 h-[22px] bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-primary disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}></div>
        </label>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700 cursor-pointer select-none">
            {label}
          </label>
        )}
      </div>
    );
  }
);
ToggleSwitch.displayName = "ToggleSwitch";

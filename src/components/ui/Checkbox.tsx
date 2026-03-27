import React, { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const defaultId = React.useId();
    const inputId = id || defaultId;

    return (
      <div className="flex items-center gap-2">
        <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
          <input
            type="checkbox"
            id={inputId}
            ref={ref}
            className={cn(
              "peer appearance-none w-5 h-5 border border-gray-300 rounded-md bg-white checked:bg-primary checked:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
              className
            )}
            {...props}
          />
          <Check className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" strokeWidth={3} />
        </div>
        {label && (
          <label htmlFor={inputId} className="text-sm text-gray-700 cursor-pointer select-none">
            {label}
          </label>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

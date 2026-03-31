import React, { type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  error?: string | boolean;
  onChange?: (value: string) => void;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, onChange, ...props }, ref) => {
    const hasError = !!error;
    const errorMessage = typeof error === "string" ? error : undefined;

    return (
      <div className="w-full space-y-1.5">
        <textarea
          ref={ref}
          className={cn(
            "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 placeholder:text-gray-400 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed",
            hasError && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
            className
          )}
          onChange={(e) => onChange?.(e.target.value)}
          {...props}
        />
        {errorMessage && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-red-600 animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle size={12} />
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

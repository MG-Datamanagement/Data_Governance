import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "framework";
export type BadgeSize = "xs" | "sm" | "md" | "lg";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
}

const variants: Record<BadgeVariant, string> = {
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-orange-50 text-orange-700 border-orange-200",
  error: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  neutral: "bg-gray-100 text-gray-700 border-gray-200",
  framework: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const sizes: Record<BadgeSize, string> = {
  xs: "px-1 py-0.5 text-[8px]",
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};

export function Badge({
  variant = "neutral",
  size = "md",
  children,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-bold border rounded-full capitalize whitespace-nowrap shrink-0",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

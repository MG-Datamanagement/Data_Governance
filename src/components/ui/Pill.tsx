import React from "react";
import { cn } from "@/lib/utils";

interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

export function Pill({ children, className, ...props }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-xl bg-gray-100 text-gray-600 text-[10px] font-bold border border-gray-200 capitalize w-fit shrink-0",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

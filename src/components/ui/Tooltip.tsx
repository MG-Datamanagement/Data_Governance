import React from "react";
import { cn } from "@/lib/utils";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({ content, children, position = "top", className }: TooltipProps) {
  return (
    <div className="group relative inline-flex justify-center items-center">
      {children}
      <div
        role="tooltip"
        className={cn(
          "absolute z-100 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-900 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap",
          position === "top" && "bottom-full mb-2",
          position === "bottom" && "top-full mt-2",
          position === "left" && "right-full mr-2",
          position === "right" && "left-full ml-2",
          className
        )}
      >
        {content}
        <div 
          className={cn(
            "absolute w-2 h-2 bg-gray-900 rotate-45",
            position === "top" && "top-full left-1/2 -translate-x-1/2 -translate-y-1/2",
            position === "bottom" && "bottom-full left-1/2 -translate-x-1/2 translate-y-1/2",
            position === "left" && "left-full top-1/2 -translate-y-1/2 -translate-x-1/2",
            position === "right" && "right-full top-1/2 -translate-y-1/2 translate-x-1/2"
          )}
        />
      </div>
    </div>
  );
}

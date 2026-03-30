"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({ content, children, position = "top", className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    
    let top = rect.top - 8;
    let left = rect.left + rect.width / 2;

    if (position === "bottom") {
      top = rect.bottom + 8;
    } else if (position === "left") {
      top = rect.top + rect.height / 2;
      left = rect.left - 8;
    } else if (position === "right") {
      top = rect.top + rect.height / 2;
      left = rect.right + 8;
    }
    
    setCoords({ top, left });
  };

  const handleMouseEnter = () => {
    updatePosition();
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      // Use capture phase to ensure scroll events across all containers are caught
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isVisible, position]);

  return (
    <>
      <div 
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-flex max-w-full"
      >
        {children}
      </div>
      {isVisible && typeof document !== "undefined" && createPortal(
        <div
          role="tooltip"
          className={cn(
            "fixed z-[9999] pointer-events-none bg-gray-900 text-white text-[11px] font-medium px-3 py-2 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-100",
            "whitespace-normal break-words max-w-[280px] leading-relaxed",
            position === "top" && "-translate-x-1/2 -translate-y-full",
            position === "bottom" && "-translate-x-1/2",
            position === "left" && "-translate-x-full -translate-y-1/2",
            position === "right" && "-translate-y-1/2",
             className
          )}
          style={{ 
            top: coords.top, 
            left: coords.left
          }}
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
        </div>,
        document.body
      )}
    </>
  );
}

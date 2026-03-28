import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

export function Spinner({ size = 16, className, ...props }: SpinnerProps) {
  return (
    <Loader2 
      size={size} 
      className={cn("animate-spin text-indigo-500", className)} 
      {...props} 
    />
  );
}

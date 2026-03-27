import React from "react";
import { CheckCircle2, AlertCircle, XCircle, Info, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusType = "success" | "warning" | "error" | "info" | "neutral";
export type StatusSize = "sm" | "md" | "lg";

export interface StatusIconProps {
  status: StatusType;
  size?: StatusSize;
  className?: string;
  icon?: LucideIcon; 
}

const config: Record<StatusType, { icon: LucideIcon; color: string }> = {
  success: { icon: CheckCircle2, color: "text-green-500" },
  warning: { icon: AlertCircle, color: "text-orange-500" },
  error: { icon: XCircle, color: "text-red-500" },
  info: { icon: Info, color: "text-blue-500" },
  neutral: { icon: Info, color: "text-gray-400" },
};

const sizes: Record<StatusSize, number> = {
  sm: 14,
  md: 18,
  lg: 24,
};

export function StatusIcon({ status, size = "md", className, icon: OverrideIcon }: StatusIconProps) {
  const { icon: DefaultIcon, color } = config[status];
  const IconToRender = OverrideIcon || DefaultIcon;
  
  return (
    <div className={cn("inline-flex items-center justify-center", color, className)}>
      <IconToRender 
        size={sizes[size]} 
        className="shrink-0" 
        strokeWidth={2.5}
        aria-hidden="true"
      />
    </div>
  );
}

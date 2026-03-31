import { LucideIcon, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "./Tooltip";

interface StatCardProps {
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value: string | number;
  info?: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

export function StatCard({
  icon: Icon,
  iconColor = "text-primary",
  iconBg,
  label,
  value,
  info,
  change,
  changeType = "neutral",
}: StatCardProps) {
  return (
    <>
      <div className="stat-card flex flex-col justify-between space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className={cn("p-1 rounded-md", iconBg)}>
              <Icon size={12} className={cn(iconColor, "shrink-0")} />
            </div>
            <span className="text-xs text-gray-600 font-medium">{label}</span>

          </div>

          {info && (
            <Tooltip content={info}>
              <div className="cursor-help text-gray-400 hover:text-gray-600 transition-colors">
                <Info size={12} />
              </div>
            </Tooltip>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-xl font-semibold text-gray-900">{value}</div>
          {change && (
            <div
              className={cn(
                "text-xs font-medium",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-danger",
                changeType === "neutral" && "text-gray-600",
              )}
            >
              {change}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

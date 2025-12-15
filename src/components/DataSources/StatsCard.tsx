import { LucideIcon, TrendingUp } from "lucide-react";
import { memo } from "react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = memo(
  ({ icon: Icon, label, value, trend, color }: any) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={20} className="text-gray-700" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <TrendingUp size={14} />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-semibold text-gray-900">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )
);

export default StatsCard;

StatsCard.displayName = "StatsCard";

import { InfoIcon, TrendingUp } from "lucide-react";
import { InfoIconTooltip } from "./InfoIconTooltip";

interface ComplianceScoreCardProps {
  score: number;
  change: string;
  overall_score_infographic: string;
}

export function ComplianceScoreCard({ score, change, overall_score_infographic }: ComplianceScoreCardProps) {
  return (
    <div className="flex flex-col items-center justify-center bg-green-50/50 rounded-2xl border border-green-100 px-3 py-4 h-full">
      <div className="text-5xl font-bold text-emerald-500 mb-2">{score}%</div>
      <div className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1">
        Overall Compliance Score
        <InfoIconTooltip text={overall_score_infographic} />
      </div>
      <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
        <TrendingUp size={14} />
        <span>{change}</span>
      </div>
    </div>
  );
}

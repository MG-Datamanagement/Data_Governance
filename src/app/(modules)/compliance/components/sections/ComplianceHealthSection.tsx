import React, { useState } from "react";
import { Shield, Sparkles, ChevronUp, ChevronDown, TrendingUp } from "lucide-react";
import dynamic from "next/dynamic";
import { ChartSkeleton } from "@/components/ui/Skeletons";
import { ComplianceScoreCard } from "@/components/ui/ComplianceScoreCard";
const ComplianceTrendsChart = dynamic(
  () => import("@/components/charts/ComplianceTrendsChart").then((m) => ({ default: m.ComplianceTrendsChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
import { InlineState } from "@/components/ui/InlineState";
import { ComplianceData } from "@/hooks/useComplianceData";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";


type Props = {
  healthQuery: ComplianceData["healthQuery"];
  insightsQuery: ComplianceData["insightsQuery"];
};

export function AIInsightsCard({ text, isLoading }: { text?: string; isLoading?: boolean }) {
  return (
    <div className="card p-4 md:p-6 border border-indigo-100 bg-indigo-50/30 rounded-2xl">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
          <Sparkles className="text-white" size={20} />
        </div>
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900">
              AI-Powered Insights
            </h3>
            <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md">
              BETA
            </span>
          </div>
          {isLoading ? (
            <div className="space-y-2 mt-2">
              <div className="h-4 bg-indigo-100/50 rounded w-full animate-pulse" />
              <div className="h-4 bg-indigo-100/50 rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-indigo-100/50 rounded w-4/6 animate-pulse" />
            </div>
          ) : (
            <p className="text-xs text-gray-600 leading-relaxed max-w-4xl whitespace-pre-wrap mt-1">
              {text?.replace(/\*\*/g, "") || "Generating AI insights based on your compliance data..."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ComplianceHealthSection({ healthQuery, insightsQuery }: Props) {
  const { data: runData, isLoading, error, refetch } = healthQuery;
  const trends = runData?.trends;
  const health = runData?.compliance_health;

  const insightsData = insightsQuery.data?.ai_insights;
  const isInsightsLoading = insightsQuery.isLoading;

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Status mapping logic
  const getStatusMetadata = (score: number) => {
    if (score >= 90) return { label: "Excellent", variant: "success" as const };
    if (score >= 75) return { label: "Good", variant: "info" as const };
    if (score >= 50) return { label: "Warning", variant: "warning" as const };
    return { label: "Critical", variant: "error" as const };
  };

  const statusMeta = health?.score ? getStatusMetadata(health.score) : { label: "N/A", variant: "neutral" as const };

  return (
    <div className={cn(
      "border border-gray-200 rounded-xl bg-white shadow-sm transition-all duration-300 overflow-hidden",
      isCollapsed ? "p-4" : "p-6 space-y-4"
    )}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 overflow-hidden flex-1">
          <div className="flex gap-3 shrink-0">
            <div className="w-8 h-8 bg-indigo-600 p-1.5 text-white rounded-lg flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div className="flex flex-col justify-center max-w-[180px]">
              <h2 className="text-base font-bold text-gray-900 leading-tight">Compliance Health</h2>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">
                Real-time governance monitoring
              </p>
            </div>
          </div>

          {/* Metrics shown ONLY when collapsed (to match the horizontal design in Image 2) */}
          {isCollapsed && !isLoading && !error && (
            <div className="hidden md:flex items-center gap-4 flex-1 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-green-600">{health?.score}%</span>
                <Badge variant={statusMeta.variant} size="sm" className="h-6">
                  {statusMeta.label}
                </Badge>
              </div>

              <div className="flex items-center gap-1 text-green-600 font-semibold text-xs bg-green-50 px-1.5 py-1 rounded-md border border-green-100">
                <div className="flex items-center justify-center">
                  <TrendingUp size={14} />
                </div>
                <span>{health?.trend_label}</span>
              </div>

              <div className="flex items-center gap-4">
                {[
                  { label: "GDPR", color: "bg-green-500" },
                  { label: "SOC 2", color: "bg-blue-500" },
                  { label: "HIPAA", color: "bg-orange-500" }
                ].map(dot => (
                  <div key={dot.label} className="flex items-center gap-1.5">
                    <div className={cn("w-2 h-2 rounded-full", dot.color)} />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{dot.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand section" : "Collapse section"}
          className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-300 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all shadow-sm shrink-0"
        >
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Row 1: Score + Trends */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
            {/* Left: Score Card */}
            <div className="md:col-span-5">
              <ComplianceScoreCard
                score={health?.score ?? 0}
                change={health?.trend_label ?? "No change"}
              />
            </div>

            {/* Right: Trends Chart */}
            <div className="md:col-span-7">
              <div className="h-full relative px-2">
                {isLoading && (
                  <InlineState
                    type="loading"
                    message="Loading compliance trends..."
                  />
                )}
                {error && (
                  <InlineState
                    type="empty"
                    message="No trends data available right now."
                    onRetry={refetch}
                  />
                )}
                {!isLoading && !error && !trends && (
                  <InlineState type="empty" message="No trend data available." />
                )}
                {!isLoading && !error && trends && (
                  <ComplianceTrendsChart data={trends} />
                )}
              </div>
            </div>
          </div>

          {(insightsData?.text || isInsightsLoading) && (
            <AIInsightsCard text={insightsData?.text} isLoading={isInsightsLoading} />
          )}
        </div>
      )}
    </div>
  );
}


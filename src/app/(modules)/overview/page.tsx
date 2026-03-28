/**
 * Overview Page
 *
 * Orchestrator only — owns layout and wires data to sections.
 * No rendering logic lives here; each section is independently
 * loadable, retryable, and swappable.
 */

"use client";

import { DataErrorFallback, EmptyState } from "@/components/Fallbacks";
import { OverviewSkeleton } from "@/components/overview/OverviewSkeleton";
import { TabNavigation } from "@/components/ui/TabNavigation";
import QuickActionsDropdown from "@/components/ui/QuickActionsDropdown";
import { useOverviewData } from "../../../hooks/useOverviewData";
import {
  ActivitySection,
  AIGovernanceSection,
  ComplianceSection,
  // DomainsSection,
  TopTagsSection,
  OverviewHeader,
  OverviewStatsGrid,
  PlatformsSection,
} from "@/components/overview/sections";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// ---------------------------------------------------------------------------
// Inner content — rendered only after the critical stats fetch resolves
// ---------------------------------------------------------------------------
function OverviewContent() {
  const {
    stats,
    aiSnapshot,
    riskTrends,
    // domains,
    topTags,
    platforms,
    activity,
    recentlyViewed,
    frameworks,
    pendingReviewCount,
    openIssues,
    governanceScore,
    complianceOverview,
  } = useOverviewData();

  const tabs = [
    { id: "overview", name: "Overview", href: "/overview" },
    { id: "compliance", name: "Compliance", href: "/compliance" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-5">
      <TabNavigation 
        tabs={tabs} 
        activeTabId="overview" 
        rightAction={<div className={stats.isLoading || !!stats.error ? "opacity-50 pointer-events-none" : ""}><QuickActionsDropdown /></div>} 
      />
      
      {stats.isLoading ? (
        <OverviewSkeleton />
      ) : stats.error ? (
        <div className="pt-10">
          <EmptyState 
            title="Overview Unavailable" 
            description="We couldn't load overview data at this time." 
            action={{ label: "Retry", onClick: () => stats.refetch() }} 
          />
        </div>
      ) : (
        <>
          <OverviewHeader />

          {/* Main two-column layout */}
          <div className="flex flex-col gap-5">
            <OverviewStatsGrid stats={stats.data!} />

            <div className="grid lg:grid-cols-12 gap-5">
              <ComplianceSection query={frameworks} overviewQuery={complianceOverview} />
              <AIGovernanceSection aiQuery={aiSnapshot} trendsQuery={riskTrends} />
              <ActivitySection
                activityQuery={activity}
                recentlyViewedQuery={recentlyViewed}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* <DomainsSection query={domains} /> */}
              <TopTagsSection query={topTags} />
              <PlatformsSection query={platforms} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function OverviewPage() {
  return (
    <ErrorBoundary>
      <OverviewContent />
    </ErrorBoundary>
  );
}

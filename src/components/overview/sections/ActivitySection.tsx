/**
 * ActivitySection
 *
 * Right-column panel containing two tabs:
 *  - Recent Activity
 *  - Recently Viewed
 *
 * Local tab state lives here; the parent page passes the two query
 * slices without caring which tab is active.
 */

import { Activity, Clock, Database, CheckCircle2, AlertCircle, PlayCircle, PlusCircle, CheckSquare, Dot } from "lucide-react";
import { cn, formatTimeAgo } from "@/lib/utils";
import { InlineState } from "@/components/ui/InlineState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OverviewData } from "@/hooks/useOverviewData";
import { getPlatformDisplay, PlatformIcon } from "@/lib/sourceTypeDisplayMap";
import { RecentActivity, RecentlyViewed } from "@/types";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import ConnectorIcon from "@/components/connectors/ConnectorIcon";
import React, { useState } from "react";

type ActivityTabType = "recent" | "viewed";

type Props = {
  activityQuery: OverviewData["activity"];
  recentlyViewedQuery: OverviewData["recentlyViewed"];
};

const TABS: { id: ActivityTabType; label: string; icon: React.ElementType; viewMoreText: string; href: string }[] =
  [
    { id: "recent", label: "Recent Activity", icon: Activity, viewMoreText: "View All Activity", href: "" },
    { id: "viewed", label: "Recently Viewed", icon: Clock, viewMoreText: "View All Datasets", href: "" },
  ];

const DEFAULT_VISIBLE_ITEMS = 12;

type ActivityItemV2Props = {
  name: string;
  platform?: string;
  tag?: string;
  tagColor?: string;
  time?: string;
  icon: PlatformIcon;
  iconColor: string;
  platformKey?: string;
};

function ActivityItemV2({
  name,
  platform,
  tag,
  tagColor,
  time,
  icon,
  iconColor,
  platformKey,
}: ActivityItemV2Props) {
  const PlatformIcon = icon;
  return (
    <div className="p-3 hover:bg-gray-50 cursor-pointer transition-colors">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-8 h-8 bg-[#f3f4f6] border border-[#e5e7eb] rounded-md flex items-center justify-center flex-shrink-0">
          {/* <PlatformIcon size={14} className={cn(iconColor)} /> */}
          <div>
            <ConnectorIcon icon={platform || ""} className="w-5 h-5 rounded-md" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div
              title={name}
              className="text-[11px] font-semibold text-black truncate"
            >
              {name}
            </div>

            {tag && <ComplianceBadge label={tag} color={tagColor || ""} />}
          </div>

          <div className="flex items-center justify-between mt-1">
            {/* <div className="text-[10px] text-gray-500 truncate">{platform}</div> */}
            <div className="text-[10px] text-gray-500 truncate">{platformKey}</div>

            {time && (
              <div className="text-[10px] text-gray-400">
                {formatTimeAgo(time)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type TimelineActivityItemProps = {
  name: string;
  time: string;
};

function analyzeActivity(msg: string) {
  const lowerMsg = msg.toLowerCase();
  
  if (lowerMsg.includes("failed") || lowerMsg.includes("error")) {
    return { color: "bg-red-500", icon: AlertCircle, iconColor: "text-red-500", highlightColor: "text-red-700" };
  } else if (lowerMsg.includes("started") || lowerMsg.includes("running")) {
    return { color: "bg-yellow-500", icon: PlayCircle, iconColor: "text-yellow-600", highlightColor: "text-yellow-700" };
  } else if (lowerMsg.includes("registered") || lowerMsg.includes("new")) {
    return { color: "bg-green-500", icon: PlusCircle, iconColor: "text-green-600", highlightColor: "text-green-700" };
  } else if (lowerMsg.includes("completed")) {
    return { color: "bg-emerald-500", icon: CheckCircle2, iconColor: "text-emerald-600", highlightColor: "text-emerald-700" };
  } else if (lowerMsg.includes("retrieved")) {
    return { color: "bg-blue-500", icon: CheckSquare, iconColor: "text-blue-500", highlightColor: "text-blue-700" };
  }
  
  return { color: "bg-indigo-500", icon: Database, iconColor: "text-indigo-500", highlightColor: "text-indigo-700" };
}

function TimelineActivityItem({ name, time }: TimelineActivityItemProps) {
  const { color, icon: Icon, iconColor } = analyzeActivity(name);

  return (
    <div className="relative pl-6 py-3">
      {/* Vertical Line */}
      <div className="absolute left-[10px] top-5 -bottom-6 w-px bg-gray-200" />

      {/* Dot Focus */}
      <div className={`absolute left-[5px] top-5 w-2.5 h-2.5 rounded-full ${color} border-2 border-white`} />

      {/* Content */}
      <div>
        <div className="text-xs font-medium text-black line-clamp-2" title={name}>
          {name}
        </div>
        
        {time && (
          <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
            <Icon size={10} className={`${iconColor}`} />
            {formatTimeAgo(time)}
          </div>
        )}
      </div>
    </div>
  );
}

function ComplianceBadge({ label, color }: { label: string; color: string }) {
  const colorMap: Record<string, string> = {
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    red: "bg-red-50 text-red-700 border-red-200",
    green: "bg-green-50 text-green-700 border-green-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };

  return (
    <span
      className={cn(
        "text-[10px] px-2 py-0.5 rounded-md border font-medium",
        colorMap[color] || "bg-gray-100 text-gray-700 border-gray-200",
      )}
    >
      {label}
    </span>
  );
}

function ActivityContent({ activityQuery, recentlyViewedQuery }: Props) {
  const {
    data: activity,
    isLoading: activityLoading,
    error: activityError,
    refetch: refetchActivity,
  } = activityQuery;

  const {
    data: recentlyViewed,
    isLoading: recentlyViewedLoading,
    error: recentlyViewedError,
    refetch: refetchRecentlyViewed,
  } = recentlyViewedQuery;

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const activeTab = (searchParams.get("activityTab") as ActivityTabType) || "recent";
  
  const setActivityTab = (tabId: ActivityTabType) => {
    const params = new URLSearchParams(searchParams);
    params.set("activityTab", tabId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const isRecent = activeTab === "recent";
  const isLoading = isRecent ? activityLoading : recentlyViewedLoading;
  const hasError = isRecent ? activityError : recentlyViewedError;
  const onRetry = isRecent ? refetchActivity : refetchRecentlyViewed;
  const items: RecentActivity[] | RecentlyViewed[] | undefined = isRecent
    ? activity
    : recentlyViewed;

  const [visibleCount, setVisibleCount] = useState({ recent: DEFAULT_VISIBLE_ITEMS, viewed: DEFAULT_VISIBLE_ITEMS });
  const [infiniteEnabled, setInfiniteEnabled] = useState({ recent: false, viewed: false });

  const isInfinite = isRecent ? infiniteEnabled.recent : infiniteEnabled.viewed;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isInfinite) return; // Wait to be turned on by CTA click
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (isRecent && activity && activity.length > visibleCount.recent) {
        setVisibleCount((prev) => ({ ...prev, recent: prev.recent + 10 }));
      } else if (!isRecent && recentlyViewed && recentlyViewed.length > visibleCount.viewed) {
        setVisibleCount((prev) => ({ ...prev, viewed: prev.viewed + 10 }));
      }
    }
  };

  const handleLoadMore = () => {
    if (isRecent) {
      setVisibleCount((prev) => ({ ...prev, recent: prev.recent + 10 }));
      setInfiniteEnabled((prev) => ({ ...prev, recent: true }));
    } else {
      setVisibleCount((prev) => ({ ...prev, viewed: prev.viewed + 10 }));
      setInfiniteEnabled((prev) => ({ ...prev, viewed: true }));
    }
  };

  const hasMoreItems = items && items.length > (isRecent ? visibleCount.recent : visibleCount.viewed);
  const viewAllLabel = isRecent ? "View All Activity" : "View All Datasets";

  return (
    <div className="overflow-hidden lg:col-span-3">
      {/* Tab Header */}
      <div className="px-2 py-0">
        <div className="flex justify-center items-center border-b border-gray-200">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActivityTab(id)}
              className={cn(
                "flex-1 py-2 text-[10px] font-medium border-b-2 transition-colors flex items-center justify-center gap-1 outline-none",
                activeTab === id
                  ? "text-primary border-primary"
                  : "text-gray-500 border-transparent hover:text-gray-700",
              )}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Body */}
      <div 
        className="flex-1 h-[550px] flex flex-col overflow-y-auto overflow-x-hidden p-2 scrollbar-thin scrollbar-thumb-gray-200"
        onScroll={handleScroll}
      >
        <div className="flex-1 divide-y divide-gray-100">
          {isLoading && (
            <InlineState
              type="loading"
              message={
                isRecent
                  ? "Loading recent activity..."
                  : "Loading recently viewed..."
              }
            />
          )}

          {!isLoading && hasError && (
            <InlineState
              type="empty"
              message="No recent activity available."
              onRetry={onRetry}
            />
          )}

          {!isLoading && !hasError && items?.length === 0 && (
            <InlineState
              type="empty"
              message={
                isRecent
                  ? "No recent activity yet."
                  : "You haven't viewed any assets yet."
              }
            />
          )}

          {!isLoading && !hasError && activeTab === "recent" && (
            <>
              {items &&
                items.length > 0 &&
                items
                  .slice(0, visibleCount.recent)
                  .map((item) => (
                    <TimelineActivityItem
                      key={item.id}
                      name={item.name}
                      time={item.time || ""}
                    />
                  ))}
            </>
          )}

          {!isLoading && !hasError && activeTab === "viewed" && (
            <>
              {items &&
                items.length > 0 &&
                (items as RecentlyViewed[])
                  .slice(0, visibleCount.viewed)
                  .map((item) => (
                    <ActivityItemV2
                      key={item.id}
                      name={item.name}
                      platform={item.platform}
                      tag={item.tag}
                      tagColor={item.tagColor}
                      time={item.time || ""}
                      icon={getPlatformDisplay(item.platform || "").icon}
                      iconColor={item.iconColor}
                      platformKey={item.platformKey}
                    />
                  ))}
            </>
          )}
        </div>

        {/* Footer */}
        {hasMoreItems && !isInfinite && (
          <div className="mt-auto px-6 py-3 text-center border-t border-transparent shrink-0">
            <button 
              onClick={handleLoadMore}
              className="text-indigo-600 font-medium text-xs hover:text-indigo-800 hover:underline transition-colors"
            >
              {viewAllLabel}
            </button>
          </div>
        )}

        {!hasMoreItems && items && items.length > 0 && (
          <div className="mt-auto pt-4 pb-2 text-center text-[10px] text-gray-400 flex items-center justify-center gap-1.5 shrink-0">
            <CheckCircle2 size={12} />
            <span>End of {isRecent ? "recent activity" : "recently viewed"}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ActivitySection(props: Props) {
  return (
    <ErrorBoundary>
      <ActivityContent {...props} />
    </ErrorBoundary>
  );
}

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

const MAX_RECENT_ACTIVITY_VISIBLE_ITEMS = 6;
const MAX_RECENTLY_VIEWED_VISIBLE_ITEMS = 5;

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
        <div className="w-7 h-7 bg-gray-100/90 rounded-md flex items-center justify-center flex-shrink-0">
          {/* <PlatformIcon size={14} className={cn(iconColor)} /> */}
          <div className="text-sm">
            <ConnectorIcon icon={platform || ""} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div
              title={name}
              className="text-xs font-medium text-gray-900 truncate"
            >
              {name}
            </div>

            {tag && <ComplianceBadge label={tag} color={tagColor || ""} />}
          </div>

          <div className="flex items-center justify-between mt-1">
            <div className="text-xs text-gray-500 truncate">{platform}</div>
            {/* <div className="text-xs text-gray-500 truncate">{platformKey}</div> */}

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
        <div className="text-xs font-medium text-gray-800 line-clamp-2" title={name}>
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
      <div className="flex-1 max-h-[400px] p-2">
        <div className="divide-y divide-gray-100">
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
                  .slice(0, MAX_RECENT_ACTIVITY_VISIBLE_ITEMS)
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
                  .slice(0, MAX_RECENTLY_VIEWED_VISIBLE_ITEMS)
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
        <div className="px-6 py-1">
          <button className="text-indigo-600 text-xs hover:text-indigo-600 hover:underline transition-colors">
            {viewAllLabel}
          </button>
        </div>
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

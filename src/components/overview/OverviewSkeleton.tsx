/**
 * OverviewSkeleton
 *
 * Shape-accurate skeleton for the Overview page.
 * Does NOT include a TabNavigation skeleton — the real tabs render immediately
 * (they need no data). Only data-driven sections below the nav are skeletonized.
 * Uses animate-pulse so every block animates in sync.
 */

/** Reusable shimmer block */
function S({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-gray-200 ${className ?? ""}`} />
  );
}

/** One stat card skeleton — mirrors StatCard shape */
function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <S className="w-8 h-8 rounded-lg" />
        <S className="w-14 h-4 rounded" />
      </div>
      <S className="w-16 h-6 rounded" />
      <S className="w-24 h-3 rounded" />
    </div>
  );
}

/** Card shell skeleton — header + body area */
function CardSkeleton({ bodyHeight = "h-44" }: { bodyHeight?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <S className="w-9 h-9 rounded-xl" />
        <div className="space-y-1.5 flex-1">
          <S className="w-36 h-4 rounded" />
          <S className="w-24 h-3 rounded" />
        </div>
      </div>
      <div className={`p-5 ${bodyHeight}`}>
        <S className="h-full w-full rounded-xl" />
      </div>
    </div>
  );
}

/** List rows skeleton (for activity / recently-viewed) */
function ListRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <S className="w-9 h-9 rounded-xl" />
        <S className="w-32 h-4 rounded" />
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-5 py-3 flex items-center gap-3">
            <S className="w-7 h-7 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <S className={`h-3 rounded ${i % 2 === 0 ? "w-3/5" : "w-2/4"}`} />
              <S className="h-2.5 rounded w-1/4" />
            </div>
            <S className="w-12 h-4 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-5">
      {/* OverviewHeader skeleton — just the descriptor text line */}
      <S className="w-72 h-4 rounded" />

      {/* StatsGrid — 6 cards */}
      <div className="grid xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>

      {/* Main row: Compliance + AI Governance + Activity */}
      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5">
          <CardSkeleton bodyHeight="h-56" />
        </div>
        <div className="lg:col-span-3">
          <CardSkeleton bodyHeight="h-56" />
        </div>
        <div className="lg:col-span-4">
          <ListRowsSkeleton rows={5} />
        </div>
      </div>

      {/* Bottom row: Top Tags + Platforms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CardSkeleton bodyHeight="h-36" />
        <CardSkeleton bodyHeight="h-36" />
      </div>
    </div>
  );
}

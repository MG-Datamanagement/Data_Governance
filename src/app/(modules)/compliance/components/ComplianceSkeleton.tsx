/**
 * ComplianceSkeleton
 *
 * Shape-accurate skeleton for the Compliance page.
 * Does NOT include a TabNavigation skeleton — tabs + action buttons render
 * immediately but action buttons are disabled during the loading state.
 * Only data-driven content sections are pulse-animated.
 */

function S({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-gray-200 ${className ?? ""}`} />
  );
}

/** Health section: score card + chart + AI insights */
function HealthSectionSkeleton() {
  return (
    <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <S className="w-10 h-10 rounded-xl" />
        <div className="space-y-1.5">
          <S className="w-36 h-4 rounded" />
          <S className="w-48 h-3 rounded" />
        </div>
      </div>

      {/* Score card + trends chart */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 space-y-4">
          <div className="border border-gray-100 rounded-xl p-5 space-y-3">
            <S className="w-16 h-16 rounded-full mx-auto" />
            <S className="w-24 h-6 rounded mx-auto" />
            <S className="w-32 h-3 rounded mx-auto" />
          </div>
        </div>
        <div className="md:col-span-7">
          <S className="h-40 w-full rounded-xl" />
        </div>
      </div>

      {/* AI Insights strip */}
      <div className="border border-indigo-100 bg-indigo-50/30 rounded-2xl p-4 flex gap-4">
        <S className="w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <S className="w-40 h-4 rounded" />
          <S className="w-full h-3 rounded" />
          <S className="w-5/6 h-3 rounded" />
          <S className="w-4/6 h-3 rounded" />
        </div>
      </div>
    </div>
  );
}

/** Issues table skeleton */
function IssuesSectionSkeleton() {
  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <S className="w-9 h-9 rounded-xl" />
          <div className="space-y-1.5">
            <S className="w-32 h-4 rounded" />
            <S className="w-20 h-3 rounded" />
          </div>
        </div>
        <S className="w-20 h-7 rounded-lg" />
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-5 py-3.5 flex items-center gap-4">
            <S className="w-5 h-5 rounded shrink-0" />
            <div className="flex-1 space-y-1.5">
              <S className={`h-3.5 rounded ${i % 2 === 0 ? "w-3/5" : "w-2/4"}`} />
              <S className="h-2.5 rounded w-1/3" />
            </div>
            <S className="w-14 h-5 rounded-full" />
            <S className="w-20 h-3 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Frameworks sidebar skeleton */
function FrameworksPanelSkeleton() {
  return (
    <div className="border border-gray-200 rounded-xl bg-white col-span-4 border-l-4 border-l-indigo-600 shadow-sm overflow-hidden flex flex-col h-full sticky top-6">
      <div className="p-6 border-b border-gray-100 flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <S className="w-5 h-5 rounded" />
            <S className="w-40 h-4 rounded" />
          </div>
          <S className="w-24 h-3 rounded ml-7" />
        </div>
        <S className="w-4 h-4 rounded" />
      </div>
      <div className="grid grid-cols-1 gap-2 p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <S className={`h-4 rounded ${i % 2 === 0 ? "w-16" : "w-20"}`} />
              <S className="w-10 h-4 rounded-full" />
            </div>
            <S className="h-2 w-full rounded-full" />
            <S className="w-28 h-3 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ComplianceSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-5">
      {/* ComplianceHeader skeleton — just subtitle text */}
      <S className="w-64 h-4 rounded" />

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        <div className="grid grid-cols-1 gap-5 col-span-8 min-w-0">
          <HealthSectionSkeleton />
          <IssuesSectionSkeleton />
        </div>
        <FrameworksPanelSkeleton />
      </div>
    </div>
  );
}

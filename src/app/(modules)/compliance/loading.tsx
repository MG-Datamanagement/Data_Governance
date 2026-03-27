/**
 * Compliance route loading skeleton (Phase 9.4)
 * Shown by Next.js App Router while the compliance page data is being fetched.
 */
export default function ComplianceLoading() {
  return (
    <div className="flex-1 overflow-y-auto p-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-48 bg-gray-200 rounded-lg mb-2" />
          <div className="h-4 w-72 bg-gray-100 rounded" />
        </div>
        <div className="h-9 w-32 bg-gray-200 rounded-lg" />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
            <div className="h-8 w-16 bg-gray-200 rounded mb-2" />
            <div className="h-2 w-full bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="h-4 w-40 bg-gray-200 rounded" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 last:border-0">
            <div className="h-4 w-4 bg-gray-200 rounded" />
            <div className="h-4 flex-1 bg-gray-100 rounded" />
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="h-4 w-16 bg-gray-100 rounded" />
            <div className="h-6 w-20 bg-gray-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Agents route loading skeleton (Phase 9.4)
 * Shown by Next.js App Router while the agents page data is being fetched.
 */
export default function AgentsLoading() {
  return (
    <div className="flex-1 overflow-y-auto p-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-40 bg-gray-200 rounded-lg mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded" />
        </div>
        <div className="h-9 w-28 bg-indigo-100 rounded-lg" />
      </div>

      {/* Agent cards grid */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl" />
              <div>
                <div className="h-4 w-28 bg-gray-200 rounded mb-1.5" />
                <div className="h-3 w-16 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded mb-2" />
            <div className="h-3 w-3/4 bg-gray-100 rounded mb-4" />
            <div className="flex items-center justify-between">
              <div className="h-6 w-20 bg-gray-100 rounded-full" />
              <div className="h-6 w-16 bg-indigo-50 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

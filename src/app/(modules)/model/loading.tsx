/**
 * Model route loading skeleton (Phase 9.4)
 * Shown by Next.js App Router while the model page data is being fetched.
 */
export default function ModelLoading() {
  return (
    <div className="flex-1 overflow-y-auto p-6 animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-7 w-44 bg-gray-200 rounded-lg mb-2" />
        <div className="h-4 w-80 bg-gray-100 rounded" />
      </div>

      {/* Two-column layout (sidebar + main) */}
      <div className="flex gap-5">
        {/* Sidebar */}
        <div className="w-56 flex-shrink-0 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-white border border-gray-100 rounded-lg px-3 flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded" />
              <div className="h-3 flex-1 bg-gray-100 rounded" />
            </div>
          ))}
        </div>

        {/* Main panel */}
        <div className="flex-1 bg-white border border-gray-100 rounded-xl p-5">
          <div className="h-5 w-48 bg-gray-200 rounded mb-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="mb-5">
              <div className="h-3 w-28 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-full bg-gray-100 rounded mb-1" />
              <div className="h-4 w-2/3 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

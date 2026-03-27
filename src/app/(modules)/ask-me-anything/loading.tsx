/**
 * Ask Me Anything route loading skeleton (Phase 9.4)
 * Shown by Next.js App Router while the AI chat page is being initialized.
 */
export default function AskMeAnythingLoading() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <div className="w-9 h-9 bg-indigo-100 rounded-xl" />
        <div>
          <div className="h-4 w-36 bg-gray-200 rounded mb-1.5" />
          <div className="h-3 w-24 bg-gray-100 rounded" />
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden px-6 py-5 space-y-5">
        {/* Assistant message */}
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex-shrink-0 mt-0.5" />
          <div className="flex-1 max-w-[70%]">
            <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
              <div className="h-3 w-full bg-gray-200 rounded mb-2" />
              <div className="h-3 w-4/5 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-3/5 bg-gray-200 rounded" />
            </div>
          </div>
        </div>

        {/* User message */}
        <div className="flex gap-3 justify-end">
          <div className="flex-1 max-w-[60%]">
            <div className="bg-indigo-100 rounded-2xl rounded-tr-none px-4 py-3">
              <div className="h-3 w-full bg-indigo-200 rounded mb-2" />
              <div className="h-3 w-2/3 bg-indigo-200 rounded" />
            </div>
          </div>
          <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0 mt-0.5" />
        </div>

        {/* Typing indicator */}
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex-shrink-0" />
          <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-gray-400 rounded-full"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
        <div className="h-11 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}

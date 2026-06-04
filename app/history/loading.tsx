/**
 * Loading skeleton for /history.
 * Mirrors the real layout: HistorySidebar shell on desktop (lg:),
 * "History" header with safe-area padding, and a stack of 5 history
 * card placeholders matching HistoryCard's dimensions.
 *
 * BottomNav is gone — sidebar lives left, so no bottom clearance.
 */
function SidebarPlaceholder() {
  return (
    <aside
      aria-hidden
      className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-[300px] lg:flex-col lg:border-r lg:border-borderSoft lg:bg-bgPrimary"
    >
      {/* Header bar */}
      <div className="flex items-center gap-2 border-b border-borderSoft px-4 py-4">
        <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
        <span className="h-3 w-24 animate-pulse rounded bg-borderSoft" />
      </div>
      {/* "New chat" button placeholder */}
      <div className="px-3 py-3">
        <div className="h-10 w-full animate-pulse rounded-lg bg-bgCard" />
      </div>
      {/* Conversation list placeholders */}
      <div className="flex flex-col gap-2 px-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[72px] animate-pulse rounded-lg border border-borderSoft bg-bgCard"
          />
        ))}
      </div>
    </aside>
  );
}

export default function HistoryLoading() {
  return (
    <main
      className="min-h-[100dvh] lg:ml-[300px]"
      aria-busy="true"
      aria-live="polite"
    >
      <SidebarPlaceholder />

      <header
        className="flex items-center justify-between px-4 pt-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        <h1 className="font-syne text-lg font-bold text-textPrimary">
          History
        </h1>
        {/* "clear all" placeholder (matches min-h 48 of the real button) */}
        <div className="h-4 w-16 animate-pulse rounded bg-borderSoft" />
      </header>

      <section
        className="flex flex-col gap-3 px-4 pb-12 pt-4"
        aria-label="Loading conversation history"
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex w-full animate-pulse items-center gap-3 rounded-lg border border-borderSoft bg-bgCard px-4 py-4"
            style={{ minHeight: 88 }}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {/* date */}
              <div className="h-3 w-20 rounded bg-borderSoft" />
              {/* preview text — truncated 1 line */}
              <div className="h-4 w-4/5 rounded bg-borderSoft" />
              {/* duration chip */}
              <div className="mt-1 h-4 w-12 rounded-full bg-borderSoft" />
            </div>
            <div className="flex flex-col items-end justify-between gap-2 self-stretch">
              {/* voice badge */}
              <div className="h-4 w-14 rounded-full bg-borderSoft" />
              {/* chevron */}
              <div className="h-5 w-5 rounded bg-borderSoft" />
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

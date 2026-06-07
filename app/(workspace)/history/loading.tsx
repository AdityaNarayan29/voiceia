/**
 * Loading skeleton for /history. Renders ONLY the content column —
 * the persistent sidebar lives in (workspace)/layout.tsx.
 */
export default function HistoryLoading() {
  return (
    <main
      className="min-h-[100dvh]"
      aria-busy="true"
      aria-live="polite"
    >
      <header
        className="flex items-center justify-between px-4 pt-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        <div className="h-6 w-24 animate-pulse rounded bg-borderSoft" />
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
            style={{ minHeight: 88, animationDelay: `${i * 70}ms` }}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="h-3 w-20 rounded bg-borderSoft" />
              <div className="h-4 w-4/5 rounded bg-borderSoft" />
              <div className="mt-1 h-4 w-12 rounded-full bg-borderSoft" />
            </div>
            <div className="flex flex-col items-end justify-between gap-2 self-stretch">
              <div className="h-4 w-14 rounded-full bg-borderSoft" />
              <div className="h-5 w-5 rounded bg-borderSoft" />
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

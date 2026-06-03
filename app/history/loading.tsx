export default function HistoryLoading() {
  return (
    <main className="min-h-[100dvh]">
      <header
        className="flex items-center justify-between px-4 pt-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        <h1 className="font-syne text-lg font-bold text-textPrimary">
          History
        </h1>
      </header>
      <section
        className="flex flex-col gap-3 px-4 pb-[100px] pt-4"
        aria-label="Loading conversation history"
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex h-[88px] w-full animate-pulse items-center gap-3 rounded-lg border border-borderSoft bg-bgCard px-4 py-4"
          >
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-3 w-20 rounded bg-borderSoft" />
              <div className="h-4 w-4/5 rounded bg-borderSoft" />
              <div className="h-3 w-12 rounded bg-borderSoft" />
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="h-4 w-12 rounded-full bg-borderSoft" />
              <div className="h-4 w-4 rounded bg-borderSoft" />
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

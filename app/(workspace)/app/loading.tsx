/**
 * Loading skeleton for /app. Renders ONLY the content column — the
 * persistent sidebar lives in (workspace)/layout.tsx and stays mounted
 * across navigations.
 */
export default function AppLoading() {
  return (
    <main
      className="flex h-[100dvh] flex-col overflow-hidden"
      aria-busy="true"
      aria-live="polite"
    >
      <h1 className="sr-only">Loading VoiceAI</h1>

      <header
        className="flex items-center justify-between gap-3 px-4 pt-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        <div
          aria-hidden
          className="h-12 w-12 animate-pulse rounded-full border border-borderSoft bg-bgCard lg:hidden"
        />
        <div
          aria-hidden
          className="ml-auto h-10 w-40 animate-pulse rounded-md border border-borderSoft bg-bgCard"
        />
      </header>

      <section
        className="flex flex-1 flex-col items-center justify-center gap-6 px-4"
        aria-hidden
      >
        <div className="relative h-32 w-32">
          <div className="absolute inset-0 animate-pulse rounded-full border border-borderSoft bg-bgCard" />
          <div
            className="absolute inset-4 animate-pulse rounded-full border border-accent/20 bg-accent/5"
            style={{ animationDelay: "120ms" }}
          />
        </div>
        <div className="h-3 w-28 animate-pulse rounded-full bg-borderSoft" />
        <div
          className="flex items-end gap-[3px]"
          aria-hidden
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <span
              key={i}
              className="block w-[3px] animate-pulse rounded-full bg-borderSoft"
              style={{
                height: `${8 + (i % 3) * 6}px`,
                animationDelay: `${i * 60}ms`,
              }}
            />
          ))}
        </div>
      </section>

      <section className="px-4 pb-2" aria-hidden>
        <div className="flex flex-col gap-3 px-4 py-3">
          <div className="flex w-full justify-end">
            <div className="h-10 w-2/3 animate-pulse rounded-2xl rounded-tr-sm bg-bgCard" />
          </div>
          <div className="flex w-full justify-start">
            <div className="h-12 w-3/4 animate-pulse rounded-2xl rounded-tl-sm bg-bgCard" />
          </div>
        </div>
      </section>
    </main>
  );
}

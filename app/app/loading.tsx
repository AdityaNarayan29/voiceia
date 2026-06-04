/**
 * Loading skeleton for /app (the talk screen).
 * Mirrors the real layout: full-viewport flex column with HistorySidebar
 * on desktop, mobile menu button + voice selector in header, centered
 * mic stack in the middle, and transcript area placeholder at the bottom.
 */

function SidebarPlaceholder() {
  return (
    <aside
      aria-hidden
      className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-[300px] lg:flex-col lg:border-r lg:border-borderSoft lg:bg-bgPrimary"
    >
      <div className="flex items-center gap-2 border-b border-borderSoft px-4 py-4">
        <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
        <span className="h-3 w-24 animate-pulse rounded bg-borderSoft" />
      </div>
      <div className="px-3 py-3">
        <div className="h-10 w-full animate-pulse rounded-lg bg-bgCard" />
      </div>
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

export default function AppLoading() {
  return (
    <main
      className="flex h-[100dvh] flex-col overflow-hidden lg:ml-[300px]"
      aria-busy="true"
      aria-live="polite"
    >
      <h1 className="sr-only">Loading VoiceAI</h1>
      <SidebarPlaceholder />

      {/* Header — mobile menu button + voice selector */}
      <header
        className="flex items-center justify-between gap-3 px-4 pt-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        {/* Mobile-only menu button placeholder */}
        <div
          aria-hidden
          className="h-12 w-12 animate-pulse rounded-full border border-borderSoft bg-bgCard lg:hidden"
        />
        {/* Voice selector placeholder */}
        <div
          aria-hidden
          className="h-10 w-40 animate-pulse rounded-md border border-borderSoft bg-bgCard"
        />
      </header>

      {/* Centered mic stack: waveform + mic button + status pill */}
      <section className="flex flex-1 flex-col items-center justify-center gap-8 px-4">
        {/* Waveform placeholder — 7 bars */}
        <div className="flex items-end gap-[3px]" aria-hidden>
          {Array.from({ length: 7 }).map((_, i) => (
            <span
              key={i}
              className="block w-[3px] animate-pulse rounded-full bg-borderSoft"
              style={{ height: `${8 + (i % 3) * 6}px` }}
            />
          ))}
        </div>
        {/* Mic button placeholder — 80x80 circle */}
        <div
          aria-hidden
          className="h-20 w-20 animate-pulse rounded-full border-2 border-borderSoft bg-bgCard"
        />
        {/* Status pill placeholder */}
        <div
          aria-hidden
          className="h-8 w-28 animate-pulse rounded-full bg-borderSoft"
        />
      </section>

      {/* Transcript area placeholder */}
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

      <div className="pb-[80px]" />
    </main>
  );
}

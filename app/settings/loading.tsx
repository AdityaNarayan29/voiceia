/**
 * Loading skeleton for /settings.
 * Mirrors the real layout:
 *   - HistorySidebar shell on desktop (lg:)
 *   - Hero header with title + tagline
 *   - 4 SectionCards in responsive grid:
 *       Voice (full-width, contains 5-voice grid)
 *       Audio, Appearance, About (2-col on lg:)
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

function SectionCardSkeleton({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-borderSoft bg-bgCard ${className}`}
    >
      {/* Card header bar */}
      <header className="flex items-center gap-2 border-b border-borderSoft bg-bgSecondary/40 px-4 py-3">
        <span className="inline-flex h-6 w-6 animate-pulse items-center justify-center rounded-md bg-accent/10" />
        <span className="h-3 w-20 animate-pulse rounded bg-borderSoft" />
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function ShimmerBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-borderSoft ${className}`} />
  );
}

export default function SettingsLoading() {
  return (
    <main
      className="min-h-[100dvh] pb-12 lg:ml-[300px]"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)" }}
      aria-busy="true"
      aria-live="polite"
    >
      <SidebarPlaceholder />

      <div className="mx-auto w-full max-w-md px-4 sm:max-w-2xl lg:max-w-5xl lg:px-6">
        {/* Hero header */}
        <header className="mb-6 space-y-2">
          <ShimmerBlock className="h-8 w-32 sm:h-9 sm:w-40" />
          <ShimmerBlock className="h-3 w-64 sm:h-4 sm:w-80" />
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
          {/* Voice section — spans full width on lg: */}
          <div className="lg:col-span-2">
            <SectionCardSkeleton>
              <ShimmerBlock className="mb-3 h-3 w-48" />
              {/* Voice tile grid: 2 / 3 / 5 cols at sm / md / lg */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-2 rounded-xl border border-borderSoft bg-bgSecondary/40 p-3"
                    aria-hidden
                  >
                    <ShimmerBlock className="h-4 w-16" />
                    <ShimmerBlock className="h-3 w-12 rounded-full" />
                    <ShimmerBlock className="mt-1 h-8 w-full rounded-md" />
                  </div>
                ))}
              </div>
            </SectionCardSkeleton>
          </div>

          {/* Audio section */}
          <SectionCardSkeleton>
            <div className="space-y-5">
              {/* Voice engine segmented control */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <ShimmerBlock className="h-4 w-24" />
                  <ShimmerBlock className="h-3 w-16" />
                </div>
                <div className="grid grid-cols-2 gap-1 rounded-lg border border-borderSoft bg-bgSecondary/40 p-1">
                  <ShimmerBlock className="h-12 rounded-md" />
                  <ShimmerBlock className="h-12 rounded-md" />
                </div>
                <ShimmerBlock className="mt-2 h-3 w-3/4" />
              </div>

              {/* Mic sensitivity */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <ShimmerBlock className="h-4 w-28" />
                  <ShimmerBlock className="h-3 w-8" />
                </div>
                <ShimmerBlock className="mb-3 h-2 w-full rounded-full" />
                {/* Mic test panel */}
                <div className="flex items-center gap-3 rounded-lg border border-borderSoft bg-bgSecondary/40 px-3 py-2">
                  <ShimmerBlock className="h-8 w-8 shrink-0 rounded-full" />
                  <ShimmerBlock className="h-6 flex-1" />
                  <ShimmerBlock className="h-3 w-8 shrink-0" />
                </div>
                <ShimmerBlock className="mt-2 h-3 w-2/3" />
              </div>

              {/* Auto-stop row */}
              <div className="border-t border-borderSoft pt-3">
                <div className="flex min-h-[48px] items-center justify-between">
                  <div className="flex-1 space-y-1">
                    <ShimmerBlock className="h-4 w-32" />
                    <ShimmerBlock className="h-3 w-44" />
                  </div>
                  <ShimmerBlock className="h-6 w-11 rounded-full" />
                </div>
              </div>
            </div>
          </SectionCardSkeleton>

          {/* Appearance section */}
          <SectionCardSkeleton>
            <div className="flex min-h-[48px] items-center justify-between">
              <div className="flex-1 space-y-1">
                <ShimmerBlock className="h-4 w-20" />
                <ShimmerBlock className="h-3 w-48" />
              </div>
              <ShimmerBlock className="h-9 w-[68px] rounded-full" />
            </div>
          </SectionCardSkeleton>

          {/* About section */}
          <SectionCardSkeleton>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              <ShimmerBlock className="h-3 w-14" />
              <ShimmerBlock className="h-3 w-12 justify-self-end" />
              <ShimmerBlock className="h-3 w-16" />
              <ShimmerBlock className="h-3 w-32 justify-self-end" />
              <ShimmerBlock className="h-3 w-12" />
              <ShimmerBlock className="h-3 w-28 justify-self-end" />
            </div>
          </SectionCardSkeleton>
        </div>
      </div>
    </main>
  );
}

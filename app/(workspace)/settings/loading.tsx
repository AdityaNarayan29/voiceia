/**
 * Loading skeleton for /settings. Renders ONLY the content column —
 * the sidebar is owned by (workspace)/layout.tsx and is already mounted
 * when this skeleton appears, so it never flashes during transitions.
 */

function ShimmerBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-borderSoft ${className}`} />
  );
}

function CardSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-borderSoft bg-bgCard">
      <header className="flex items-center gap-2 border-b border-borderSoft bg-bgSecondary/40 px-4 py-3">
        <span className="inline-flex h-6 w-6 animate-pulse items-center justify-center rounded-md bg-accent/10" />
        <span className="h-3 w-20 animate-pulse rounded bg-borderSoft" />
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function SettingsLoading() {
  return (
    <main
      className="min-h-[100dvh] pb-12"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)" }}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mx-auto w-full max-w-md px-4 sm:max-w-xl lg:max-w-2xl lg:px-6">
        <header className="mb-6 space-y-2">
          <ShimmerBlock className="h-8 w-32 sm:h-9 sm:w-40" />
          <ShimmerBlock className="h-3 w-64 sm:h-4 sm:w-80" />
        </header>

        <div className="grid grid-cols-1 gap-4 lg:gap-5">
          <CardSkeleton>
            <ShimmerBlock className="mb-3 h-3 w-48" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2 rounded-xl border border-borderSoft bg-bgSecondary/40 p-3"
                >
                  <ShimmerBlock className="h-4 w-16" />
                  <ShimmerBlock className="h-3 w-12 rounded-full" />
                  <ShimmerBlock className="mt-1 h-8 w-full rounded-md" />
                </div>
              ))}
            </div>
          </CardSkeleton>

          <CardSkeleton>
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <ShimmerBlock className="h-4 w-24" />
                  <ShimmerBlock className="h-3 w-16" />
                </div>
                <div className="grid grid-cols-2 gap-1 rounded-lg border border-borderSoft bg-bgSecondary/40 p-1">
                  <ShimmerBlock className="h-12 rounded-md" />
                  <ShimmerBlock className="h-12 rounded-md" />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <ShimmerBlock className="h-4 w-28" />
                  <ShimmerBlock className="h-3 w-8" />
                </div>
                <ShimmerBlock className="mb-3 h-2 w-full rounded-full" />
                <div className="flex items-center gap-3 rounded-lg border border-borderSoft bg-bgSecondary/40 px-3 py-2">
                  <ShimmerBlock className="h-8 w-8 shrink-0 rounded-full" />
                  <ShimmerBlock className="h-6 flex-1" />
                  <ShimmerBlock className="h-3 w-8 shrink-0" />
                </div>
              </div>

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
          </CardSkeleton>

          <CardSkeleton>
            <div className="flex min-h-[48px] items-center justify-between">
              <div className="flex-1 space-y-1">
                <ShimmerBlock className="h-4 w-20" />
                <ShimmerBlock className="h-3 w-48" />
              </div>
              <ShimmerBlock className="h-9 w-[68px] rounded-full" />
            </div>
          </CardSkeleton>

          <CardSkeleton>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              <ShimmerBlock className="h-3 w-14" />
              <ShimmerBlock className="h-3 w-12 justify-self-end" />
              <ShimmerBlock className="h-3 w-16" />
              <ShimmerBlock className="h-3 w-32 justify-self-end" />
            </div>
          </CardSkeleton>
        </div>
      </div>
    </main>
  );
}

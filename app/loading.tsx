/**
 * Global loading fallback shown by Next.js for any route segment that
 * doesn't define its own loading.tsx.
 *
 * Kept intentionally minimal: just a centered pulsing accent dot.
 * Per-page loaders (/history, /settings, /app) give the real
 * page-shaped skeletons so first-paint matches the destination.
 */
export default function GlobalLoading() {
  return (
    <main
      className="flex min-h-[100dvh] items-center justify-center bg-bgPrimary lg:ml-[300px]"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading"
    >
      <span
        aria-hidden
        className="h-3 w-3 animate-pulse rounded-full bg-accent shadow-[0_0_24px_var(--accent-glow)]"
      />
      <span className="sr-only">Loading…</span>
    </main>
  );
}

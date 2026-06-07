/**
 * Workspace-wide loading skeleton.
 *
 * The persistent sidebar is rendered by (workspace)/layout.tsx and stays
 * mounted across navigations — so this skeleton intentionally renders ONLY
 * the content column. No sidebar placeholder; nothing that could flash a
 * second copy of the rail in.
 *
 * Stays neutral: a soft pulse on the centered area so the user sees the
 * shell respond instantly, then real content takes over with a stagger.
 */
export default function WorkspaceLoading() {
  return (
    <main
      className="flex h-[100dvh] flex-col"
      aria-busy="true"
      aria-live="polite"
    >
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
        <div className="h-24 w-24 animate-pulse rounded-full border border-borderSoft bg-bgCard shadow-[0_0_30px_var(--accent-glow)]" />
        <div className="h-3 w-28 animate-pulse rounded-full bg-borderSoft" />
      </section>
    </main>
  );
}

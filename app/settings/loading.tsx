function SkeletonRow({ width = "w-32" }: { width?: string }) {
  return (
    <div className="flex min-h-[48px] items-center justify-between py-2">
      <div className={`h-4 ${width} animate-pulse rounded bg-borderSoft`} />
      <div className="h-4 w-12 animate-pulse rounded bg-borderSoft" />
    </div>
  );
}

function SkeletonSection({
  rows,
  label,
}: {
  rows: number;
  label: string;
}) {
  return (
    <section
      className="mb-6"
      aria-label={`Loading ${label}`}
    >
      <div className="mb-3 h-3 w-16 animate-pulse rounded bg-borderSoft" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </section>
  );
}

export default function SettingsLoading() {
  return (
    <main
      className="min-h-[100dvh] px-4 py-6 pb-[100px]"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)" }}
    >
      <div className="mb-6 h-6 w-24 animate-pulse rounded bg-borderSoft" />
      <SkeletonSection rows={5} label="voice settings" />
      <SkeletonSection rows={2} label="audio settings" />
      <SkeletonSection rows={1} label="appearance settings" />
      <SkeletonSection rows={2} label="about" />
    </main>
  );
}

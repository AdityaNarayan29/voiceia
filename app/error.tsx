"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("GlobalError:", error);
  }, [error]);

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertTriangle size={56} strokeWidth={1.5} className="text-error" />
      <h1 className="font-syne text-2xl font-bold text-textPrimary">
        Something went wrong
      </h1>
      <p className="max-w-xs font-geistMono text-xs text-textMuted">
        {error.message || "An unexpected error occurred."}
      </p>
      <Button
        onClick={reset}
        className="mt-2 min-h-[48px] bg-accent px-6 font-syne font-semibold text-bgPrimary hover:bg-accent/90"
      >
        Try again
      </Button>
    </main>
  );
}

"use client";

import { memo } from "react";
import type { VoiceState } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusPillProps {
  state: VoiceState;
}

const COPY: Record<VoiceState, string> = {
  idle: "Tap to speak",
  listening: "Listening...",
  processing: "Thinking...",
  speaking: "Speaking...",
};

function StatusPillImpl({ state }: StatusPillProps) {
  const isListening = state === "listening";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-geistMono text-xs font-medium transition-all duration-300 ease-in-out",
        state === "idle" && "bg-borderSoft text-textMuted",
        isListening && "bg-accent/15 text-accent",
        state === "processing" && "bg-warning/15 text-warning",
        state === "speaking" && "bg-success/15 text-success",
      )}
    >
      {isListening && (
        <span
          aria-hidden
          className="h-2 w-2 animate-pulse rounded-full bg-accent"
        />
      )}
      <span>{COPY[state]}</span>
    </div>
  );
}

export const StatusPill = memo(StatusPillImpl);

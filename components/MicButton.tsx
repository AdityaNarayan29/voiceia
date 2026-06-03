"use client";

import { Mic } from "lucide-react";
import type { KeyboardEvent } from "react";
import type { VoiceState } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MicButtonProps {
  state: VoiceState;
  onClick: () => void;
  disabled?: boolean;
}

const A11Y_LABELS: Record<VoiceState, string> = {
  idle: "Start listening",
  listening: "Stop listening",
  processing: "Processing your message",
  speaking: "AI is speaking",
};

export function MicButton({ state, onClick, disabled }: MicButtonProps) {
  const isListening = state === "listening";
  const isProcessing = state === "processing";
  const isSpeaking = state === "speaking";

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <button
      type="button"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={A11Y_LABELS[state]}
      aria-pressed={isListening}
      className={cn(
        "relative inline-flex h-20 w-20 items-center justify-center rounded-full border-2 transition-colors duration-300 ease-in-out",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bgPrimary",
        state === "idle" && "border-borderStrong bg-bgCard text-textMuted",
        isListening && "border-accent bg-accent/10 text-accent",
        isProcessing && "border-warning/50 bg-warning/5 text-warning",
        isSpeaking && "anim-mic-breathe border-accent bg-accent text-white",
      )}
    >
      {isListening && (
        <span
          aria-hidden
          className="anim-mic-pulse-ring pointer-events-none absolute inset-0 rounded-full border-2 border-accent"
        />
      )}
      {isProcessing && (
        <span
          aria-hidden
          className="anim-mic-spin pointer-events-none absolute inset-0 rounded-full border-2 border-transparent border-t-warning"
        />
      )}
      <Mic size={28} strokeWidth={2} aria-hidden />
    </button>
  );
}

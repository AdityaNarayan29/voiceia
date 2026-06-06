"use client";

import { useMemo, type KeyboardEvent } from "react";
import dynamic from "next/dynamic";
import { Mic } from "lucide-react";
import type { VoiceState } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * WebGL Orb is client-only; ssr:false avoids a Renderer construction
 * during server render. ~83 KB shared with the landing's Ferrofluid.
 */
const Orb = dynamic(() => import("@/components/ui/orb"), { ssr: false });

interface OrbMicButtonProps {
  state: VoiceState;
  onClick: () => void;
  disabled?: boolean;
  /** Button size in px. Defaults to 120. */
  size?: number;
}

const A11Y_LABELS: Record<VoiceState, string> = {
  idle: "Start listening",
  listening: "Stop listening",
  processing: "Cancel response",
  speaking: "Stop speaking",
};

/**
 * State → orb visuals. Each state has a distinct hue so you can tell
 * them apart from the orb alone (no waveform / status pill anymore).
 *
 *   idle       → hue 30  (warm orange — passive)
 *   listening  → hue 200 (cyan — matches the accent, "I hear you")
 *   processing → hue 280 (purple — "thinking")
 *   speaking   → hue 69  (yellow-green — "AI talking back")
 */
function orbPropsFor(state: VoiceState) {
  switch (state) {
    case "listening":
      return {
        hue: 200,
        forceHoverState: true,
        hoverIntensity: 0.3,
        rotateOnHover: true,
      };
    case "processing":
      return {
        hue: 280,
        forceHoverState: true,
        hoverIntensity: 0.22,
        rotateOnHover: true,
      };
    case "speaking":
      return {
        hue: 69,
        forceHoverState: false,
        hoverIntensity: 0.08,
        rotateOnHover: false,
      };
    case "idle":
    default:
      return {
        hue: 30,
        forceHoverState: false,
        hoverIntensity: 0.2,
        rotateOnHover: true,
      };
  }
}

export function OrbMicButton({
  state,
  onClick,
  disabled,
  size = 120,
}: OrbMicButtonProps) {
  const isListening = state === "listening";
  const isProcessing = state === "processing";
  const isSpeaking = state === "speaking";
  // Pressed/busy semantics for screen readers — speaking is busy too,
  // even if visually we calm the orb down.
  const isBusy = isProcessing || isSpeaking;
  const orbProps = useMemo(() => orbPropsFor(state), [state]);

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
      onClick={onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={A11Y_LABELS[state]}
      aria-pressed={isListening}
      aria-busy={isBusy}
      style={{ width: size, height: size }}
      className={cn(
        "group relative inline-flex items-center justify-center rounded-full",
        "transition-transform duration-300 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bgPrimary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "active:scale-[0.97]",
        // No state-based box-shadow halo — matches HeroOrb on landing,
        // which has no outer glow. Orb's own animation conveys state.
      )}
    >
      {/* WebGL orb canvas fills the button — same as HeroOrb */}
      <span className="absolute inset-0 overflow-hidden rounded-full">
        <Orb {...orbProps} backgroundColor="#0a0a0f" />
      </span>

      {/* Soft inner glass to give the mic icon contrast.
          Kept because this is a button (the icon needs legibility).
          HeroOrb has no icon so doesn't need this. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[18%] rounded-full bg-bgPrimary/30 backdrop-blur-[2px]"
      />

      {/* Mic icon — neutral color across all states, no per-state
          drop-shadow flash. Orb hue does the state signaling. */}
      <span
        aria-hidden
        className="pointer-events-none relative z-10 inline-flex items-center justify-center text-textPrimary"
      >
        <Mic
          size={Math.round(size * 0.28)}
          strokeWidth={2}
          aria-hidden
        />
      </span>
    </button>
  );
}

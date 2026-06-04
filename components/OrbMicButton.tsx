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
  processing: "Processing your message",
  speaking: "AI is speaking",
};

/**
 * State → orb visuals, kept in lockstep with the Waveform's color logic:
 *   idle       → hue 30 (warm), passive (no force-hover)
 *   listening  → hue 30 (warm), force-hover ON  (user is speaking — warm = "you")
 *   processing → hue 69 (yellow-green "thinking"), force-hover ON
 *   speaking   → hue 210 (calm green, matches waveform's success bar), force-hover OFF, low intensity
 *
 * Speaking deliberately drops force-hover and rotation so the orb settles
 * into a gentle ambient state — matching the Waveform's slower 1.1s pulse.
 */
function orbPropsFor(state: VoiceState) {
  switch (state) {
    case "listening":
      return {
        hue: 30,
        forceHoverState: true,
        hoverIntensity: 0.3,
        rotateOnHover: true,
      };
    case "processing":
      return {
        hue: 69,
        forceHoverState: true,
        hoverIntensity: 0.22,
        rotateOnHover: true,
      };
    case "speaking":
      return {
        hue: 210,
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
        "transition-[box-shadow,transform] duration-300 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bgPrimary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "active:scale-[0.97]",
        // State-aligned outer glow — matches Waveform palette
        isListening && "shadow-[0_0_36px_var(--accent-glow)]",
        isProcessing &&
          "shadow-[0_0_44px_color-mix(in_oklab,var(--warning)_50%,transparent)]",
        isSpeaking &&
          "shadow-[0_0_32px_color-mix(in_oklab,var(--success)_40%,transparent)]",
      )}
    >
      {/* WebGL orb canvas fills the button */}
      <span className="absolute inset-0 overflow-hidden rounded-full">
        <Orb {...orbProps} backgroundColor="#0a0a0f" />
      </span>

      {/* Soft inner glass to give the mic icon contrast */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[18%] rounded-full bg-bgPrimary/30 backdrop-blur-[2px]"
      />

      {/* Mic icon — sits on top of the orb */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none relative z-10 inline-flex items-center justify-center",
          "transition-colors duration-300",
          isProcessing
            ? "text-warning"
            : isSpeaking
              ? "text-success"
              : "text-textPrimary",
        )}
        style={{
          filter: isListening
            ? "drop-shadow(0 0 12px var(--accent))"
            : isProcessing
              ? "drop-shadow(0 0 10px color-mix(in oklab, var(--warning) 70%, transparent))"
              : isSpeaking
                ? "drop-shadow(0 0 10px color-mix(in oklab, var(--success) 60%, transparent))"
                : undefined,
        }}
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

"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

interface MicLevelMeterProps {
  /** 0..1 audio level. */
  level: number;
  /** When true, the meter is dimmed and the level is ignored. */
  inactive?: boolean;
  /** Number of vertical bars. Default 24. */
  bars?: number;
  className?: string;
}

/**
 * Horizontal LED-style mic level meter.
 * Bars light up left-to-right as the level rises; each bar slightly delayed
 * so the meter has a smooth "filling" feel, not a jumpy thresholded look.
 */
function MicLevelMeterImpl({
  level,
  inactive = false,
  bars = 24,
  className,
}: MicLevelMeterProps) {
  const clamped = inactive ? 0 : Math.max(0, Math.min(1, level));
  // Curve the level so small voices register visually but loud ones don't peg.
  const shaped = Math.pow(clamped, 0.6);
  const lit = Math.round(shaped * bars);

  return (
    <div
      role="meter"
      aria-label="Microphone level"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      className={cn(
        "flex h-6 items-end gap-[3px]",
        inactive && "opacity-40",
        className,
      )}
    >
      {Array.from({ length: bars }).map((_, i) => {
        const active = i < lit;
        // Color zones: green-ish for first 60%, accent for middle, warning at peak.
        const zone =
          i / bars < 0.6 ? "success" : i / bars < 0.85 ? "accent" : "warning";
        const color =
          zone === "success"
            ? "var(--success)"
            : zone === "accent"
              ? "var(--accent)"
              : "var(--warning)";
        // Bar height ramps up across the meter so it reads as a "ladder".
        const heightPct = 40 + (i / bars) * 60;
        return (
          <span
            key={i}
            aria-hidden
            className="w-[3px] rounded-full transition-[opacity,background] duration-75"
            style={{
              height: `${heightPct}%`,
              background: active ? color : "var(--border-strong)",
              opacity: active ? 0.95 : 0.35,
            }}
          />
        );
      })}
    </div>
  );
}

export const MicLevelMeter = memo(MicLevelMeterImpl);

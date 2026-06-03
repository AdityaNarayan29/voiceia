"use client";

import { memo } from "react";
import type { VoiceState } from "@/lib/types";

interface WaveformProps {
  state: VoiceState;
  /** 0–1 live mic level; only used while listening. */
  level?: number;
}

const DELAYS = [0, 0.1, 0.2, 0.3, 0.2, 0.1, 0];
const BAR_WEIGHTS = [0.55, 0.75, 0.9, 1, 0.9, 0.75, 0.55];

type Range = { min: number; max: number };

const RANGES: Record<Exclude<VoiceState, "idle">, Range> = {
  listening: { min: 8, max: 32 },
  speaking: { min: 6, max: 24 },
  processing: { min: 8, max: 12 },
};

const DURATIONS: Record<Exclude<VoiceState, "idle">, string> = {
  listening: "0.6s",
  speaking: "1.1s",
  processing: "1.4s",
};

function WaveformImpl({ state, level = 0 }: WaveformProps) {
  const active = state !== "idle";
  const range = active ? RANGES[state] : { min: 4, max: 4 };
  const duration = active ? DURATIONS[state] : "0s";
  const reactive = state === "listening";

  const barColor =
    state === "listening"
      ? "var(--accent)"
      : state === "speaking"
        ? "var(--success)"
        : state === "processing"
          ? "color-mix(in oklab, var(--warning) 60%, transparent)"
          : "var(--border-strong)";

  return (
    <div
      className="flex items-center justify-center gap-1"
      style={
        {
          "--bar-min": `${range.min}px`,
          "--bar-max": `${range.max}px`,
          "--bar-duration": duration,
          "--bar-play": active && !reactive ? "running" : "paused",
        } as React.CSSProperties
      }
      aria-hidden
    >
      {DELAYS.map((delay, i) => {
        const height = reactive
          ? range.min +
            (range.max - range.min) * Math.min(1, level) * BAR_WEIGHTS[i]
          : range.min;
        return (
          <span
            key={i}
            className="anim-wave-bar block w-[3px] rounded-full transition-[height] duration-75"
            style={{
              height: `${height}px`,
              background: barColor,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}

export const Waveform = memo(WaveformImpl);

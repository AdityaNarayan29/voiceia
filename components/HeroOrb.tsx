"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

export type OrbState = "idle" | "listening" | "speaking";

interface HeroOrbProps {
  state: OrbState;
  /** 0–1, drives ring scale + bar height when listening. */
  level?: number;
}

const BAR_WEIGHTS = [0.4, 0.65, 0.8, 1, 0.9, 1, 0.8, 0.65, 0.4];

function HeroOrbImpl({ state, level = 0 }: HeroOrbProps) {
  const reactive = state === "listening";
  const speaking = state === "speaking";

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 260, height: 260 }}
      aria-hidden
    >
      <span
        className={cn(
          "anim-orbit-slow absolute inset-0 rounded-full border border-accent/15",
        )}
        style={{ boxShadow: "0 0 60px var(--accent-glow)" }}
      />
      <span className="anim-orbit-slower absolute inset-6 rounded-full border border-accent/10" />
      <span className="absolute inset-12 rounded-full border border-accent/20" />

      <span
        className={cn(
          "absolute inset-16 rounded-full",
          "bg-gradient-to-b from-accent/20 to-transparent",
          "anim-accent-pulse",
        )}
        style={{
          filter: "blur(18px)",
          transform: reactive
            ? `scale(${1 + level * 0.25})`
            : speaking
              ? "scale(1.08)"
              : undefined,
          transition: "transform 0.15s ease-out",
        }}
      />

      <div className="relative z-10 flex h-24 items-end gap-[6px]">
        {BAR_WEIGHTS.map((w, i) => {
          const base = 8;
          const max = 64;
          const h = reactive
            ? base + (max - base) * Math.min(1, level) * w
            : speaking
              ? base + (max - base) * w * (0.5 + 0.5 * Math.sin(i))
              : base + w * 6;
          return (
            <span
              key={i}
              className="w-[3px] rounded-full bg-accent"
              style={{
                height: `${h}px`,
                opacity: 0.6 + w * 0.4,
                transition: "height 80ms ease-out",
                boxShadow: "0 0 12px var(--accent-glow)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export const HeroOrb = memo(HeroOrbImpl);

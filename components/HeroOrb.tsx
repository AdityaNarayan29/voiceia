"use client";

import { memo, useMemo } from "react";
import dynamic from "next/dynamic";

export type OrbState = "idle" | "listening" | "speaking";

interface HeroOrbProps {
  state: OrbState;
  /**
   * 0–1 demo level. Kept for backward compat with the scripted demo
   * but unused — the WebGL orb has its own motion and the orb's hue
   * shift already conveys state.
   */
  level?: number;
  /** Total orb size in px. Defaults to 360. */
  size?: number;
}

/**
 * WebGL Orb is client-only; ssr:false avoids constructing a Renderer
 * during server render. Shares the ogl chunk with OrbMicButton.
 */
const Orb = dynamic(() => import("@/components/ui/orb"), { ssr: false });

/**
 * Mirrors OrbMicButton's state→visual mapping so the hero and the
 * in-app mic feel like the same object:
 *   idle       → hue 30 (warm), passive
 *   listening  → hue 30 (warm), force-hover ON
 *   speaking   → hue 210 (calm green), force-hover OFF, low intensity
 */
function orbPropsFor(state: OrbState) {
  switch (state) {
    case "listening":
      return {
        hue: 30,
        forceHoverState: true,
        hoverIntensity: 0.3,
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

function HeroOrbImpl({ state, size = 360 }: HeroOrbProps) {
  const orbProps = useMemo(() => orbPropsFor(state), [state]);

  return (
    <div
      className="relative overflow-hidden rounded-full"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Orb {...orbProps} backgroundColor="#0a0a0f" />
    </div>
  );
}

export const HeroOrb = memo(HeroOrbImpl);

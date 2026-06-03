"use client";

import { useEffect } from "react";

interface EdgeSwipeOptions {
  /** Side of the screen to listen on. */
  edge: "left" | "right";
  /** Max distance from the edge where touchstart must happen, in px. */
  edgeThreshold?: number;
  /** Min horizontal travel before firing, in px. */
  activationDistance?: number;
  /** Disable the listener entirely. */
  disabled?: boolean;
  /** Fired once per gesture when the threshold is crossed. */
  onSwipe: () => void;
}

/**
 * Detect an inward edge swipe (iOS/Android back-style gesture).
 * Fires once per touch. Ignores swipes that start mid-screen or move
 * mostly vertically.
 */
export function useEdgeSwipe({
  edge,
  edgeThreshold = 24,
  activationDistance = 60,
  disabled,
  onSwipe,
}: EdgeSwipeOptions) {
  useEffect(() => {
    if (disabled || typeof window === "undefined") return;
    let startX = 0;
    let startY = 0;
    let armed = false;
    let fired = false;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const width = window.innerWidth;
      const inEdge =
        edge === "left"
          ? t.clientX <= edgeThreshold
          : t.clientX >= width - edgeThreshold;
      armed = inEdge;
      fired = false;
      startX = t.clientX;
      startY = t.clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!armed || fired) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dy) > Math.abs(dx)) {
        armed = false;
        return;
      }
      const enoughTravel =
        edge === "left" ? dx > activationDistance : -dx > activationDistance;
      if (enoughTravel) {
        fired = true;
        armed = false;
        onSwipe();
      }
    };

    const onTouchEnd = () => {
      armed = false;
      fired = false;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [edge, edgeThreshold, activationDistance, disabled, onSwipe]);
}

"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface RevealOptions {
  /** CSS selector or element list relative to the container. */
  selector?: string;
  /** Initial Y offset (px). */
  y?: number;
  /** Initial X offset (px). */
  x?: number;
  /** Per-element stagger seconds. */
  stagger?: number;
  /** Duration seconds. */
  duration?: number;
  /** Delay before the first child animates. */
  delay?: number;
  /** Re-run when any of these deps change. */
  deps?: unknown[];
  /** When false, the hook is a no-op (useful while waiting on hydration). */
  enabled?: boolean;
}

/**
 * Stagger-reveals children matching `selector` on mount.
 * Respects prefers-reduced-motion. Returns a ref to attach to the container.
 *
 * Pattern: pin a stable `data-reveal` attribute on the items so the
 * selector survives Tailwind class churn.
 */
export function useGsapReveal<T extends HTMLElement = HTMLDivElement>(
  options: RevealOptions = {},
) {
  const {
    selector = "[data-reveal]",
    y = 12,
    x = 0,
    stagger = 0.06,
    duration = 0.5,
    delay = 0,
    deps = [],
    enabled = true,
  } = options;

  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = ref.current;
    if (!root) return;
    const targets = root.querySelectorAll<HTMLElement>(selector);
    if (!targets.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y, x },
        {
          opacity: 1,
          y: 0,
          x: 0,
          duration,
          delay,
          stagger,
          ease: "power3.out",
          clearProps: "transform,opacity,willChange",
        },
      );
    }, root);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  return ref;
}

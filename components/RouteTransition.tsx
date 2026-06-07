"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Crossfades route content between /app, /settings, /history without
 * remounting the surrounding workspace shell (sidebar, persistent chrome).
 * The motion wrapper lives BELOW the sidebar in the tree so the sidebar
 * never animates on navigation.
 *
 * Uses mode="sync" + key=pathname so the incoming page starts its enter
 * the moment the outgoing one starts its exit — they crossfade in place
 * rather than waiting in series (avoids a brief empty frame).
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (reduceMotion) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{
          duration: 0.26,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="min-h-[100dvh]"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Mounts the Ferrofluid WebGL canvas once at the root and keeps it alive
 * for the lifetime of the session — even when navigating away from "/".
 * The canvas is visually hidden on non-landing routes so it doesn't paint,
 * but it isn't unmounted, so coming back to "/" is instant (no
 * Renderer re-init flash).
 *
 * Mounts lazily after first paint to keep the initial bundle small.
 */
const Ferrofluid = dynamic(() => import("@/components/ui/ferrofluid"), {
  ssr: false,
});

export function LandingBackground() {
  const pathname = usePathname() ?? "";
  const isLanding = pathname === "/";
  const [mounted, setMounted] = useState(false);

  // Defer mounting until we know the route. Once mounted, keep alive.
  useEffect(() => {
    if (isLanding) setMounted(true);
  }, [isLanding]);

  // If the user has never visited "/" yet (e.g. direct deep link), keep
  // the bundle out of the critical path.
  if (!mounted) return null;

  return (
    <div
      aria-hidden
      data-active={isLanding}
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-500 ease-out motion-reduce:hidden data-[active=false]:opacity-0 data-[active=true]:opacity-100"
      style={{
        // Pause work while invisible: visibility hidden detaches from
        // hit-testing AND keeps the WebGL context alive without compositing.
        visibility: isLanding ? "visible" : "hidden",
      }}
    >
      <Ferrofluid glow={1} />
    </div>
  );
}

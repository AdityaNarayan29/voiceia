"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HistoryDrawer, HistorySidebar } from "@/components/HistoryDrawer";
import { useEdgeSwipe } from "@/lib/useEdgeSwipe";
import type { Conversation } from "@/lib/types";

/**
 * The persistent workspace chrome. Owns the desktop sidebar and the
 * mobile history drawer. Stays mounted across /app, /settings, /history
 * so the sidebar never remounts on navigation.
 *
 * Sidebar row taps universally route to /app, passing intent via
 * sessionStorage (read by /app on mount).
 */
export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // The /app page emits this event whenever it adopts, mints, or clears
  // its current session id so the sidebar can highlight the matching
  // row in real time (e.g. after the first utterance of a new chat
  // mints a fresh id).
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string | null>).detail;
      setActiveId(detail ?? null);
    };
    window.addEventListener("voiceai:session-change", handler);
    return () =>
      window.removeEventListener("voiceai:session-change", handler);
  }, []);

  const handleSelect = useCallback(
    (c: Conversation) => {
      try {
        sessionStorage.setItem("voiceai-resume-id", c.id);
        sessionStorage.removeItem("voiceai-new-chat");
      } catch {
        /* ignore */
      }
      setActiveId(c.id);
      if (!pathname.startsWith("/app")) {
        router.push("/app");
      } else {
        // Trigger a re-read on /app even when already there.
        window.dispatchEvent(new CustomEvent("voiceai:resume", { detail: c.id }));
      }
    },
    [router, pathname],
  );

  const handleNewChat = useCallback(() => {
    try {
      sessionStorage.setItem("voiceai-new-chat", "1");
      sessionStorage.removeItem("voiceai-resume-id");
    } catch {
      /* ignore */
    }
    setActiveId(null);
    if (!pathname.startsWith("/app")) {
      router.push("/app");
    } else {
      window.dispatchEvent(new CustomEvent("voiceai:new-chat"));
    }
  }, [router, pathname]);

  // Left-edge swipe opens the mobile drawer everywhere in the workspace,
  // matching what /app used to do exclusively. Disabled while open.
  useEdgeSwipe({
    edge: "left",
    onSwipe: () => setMobileOpen(true),
    disabled: mobileOpen,
  });

  return (
    <div className="relative">
      {/* Desktop persistent rail */}
      <HistorySidebar
        onSelect={handleSelect}
        onNewChat={handleNewChat}
        activeId={activeId}
      />

      {/* Mobile drawer (shared instance across routes) */}
      <HistoryDrawer
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        onSelect={handleSelect}
        onNewChat={handleNewChat}
        activeId={activeId}
      />

      {/* The animated content column. ml gutter lives here, NOT inside each
          route, so the sidebar isn't pushed by the transition wrapper. */}
      <div className="lg:ml-[300px]">{children}</div>

      {/* Expose drawer-open to the page header (mobile hamburger). */}
      <MobileTriggerPortal onOpen={() => setMobileOpen(true)} />
    </div>
  );
}

/**
 * Provides a window-event-based bridge so the in-content mobile hamburger
 * can request the drawer to open without prop-drilling through the
 * transition wrapper. Listens via document.dispatchEvent fired from the
 * page-level button.
 */
function MobileTriggerPortal({ onOpen }: { onOpen: () => void }) {
  useEffect(() => {
    const handler = () => onOpen();
    window.addEventListener("voiceai:open-drawer", handler);
    return () => window.removeEventListener("voiceai:open-drawer", handler);
  }, [onOpen]);
  return null;
}

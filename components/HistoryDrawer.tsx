"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import {
  Clock,
  MessageSquare,
  Plus,
  Settings as SettingsIcon,
  Trash2,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VOICES } from "@/lib/constants";
import { useConversationHistory } from "@/lib/useConversationHistory";
import type { Conversation } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HistoryProps {
  /** Called when a row is tapped. Drawer closes automatically in Sheet mode. */
  onSelect: (conversation: Conversation) => void;
  /** Called when the "New chat" button is tapped. Drawer closes in Sheet mode. */
  onNewChat?: () => void;
  /** Highlighted row (current conversation being viewed). */
  activeId?: string | null;
}

interface HistoryDrawerProps extends HistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatRelative(ts: number): string {
  const diffSec = Math.max(0, (Date.now() - ts) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  const days = Math.floor(diffSec / 86400);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function previewText(c: Conversation): string {
  const firstUser = c.messages.find((m) => m.role === "user")?.content;
  return firstUser?.trim() || "(no transcript)";
}

function ConversationRow({
  c,
  active,
  onClick,
}: {
  c: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  const voice = VOICES.find((v) => v.id === c.voice);
  return (
    <motion.button
      type="button"
      layout="position"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={cn(
        "group relative flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left",
        "transition-[background-color,border-color,box-shadow] duration-200",
        active
          ? "border-accent/40 bg-accent/10 shadow-[0_0_16px_var(--accent-glow)]"
          : "border-borderSoft bg-bgCard hover:border-accent/30 hover:bg-accent/5",
      )}
    >
      {active && (
        <motion.span
          layoutId="conversation-active-rail"
          aria-hidden
          className="absolute left-0 top-2 h-[calc(100%-1rem)] w-[3px] rounded-r-full bg-accent shadow-[0_0_10px_var(--accent-glow)]"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      <div
        className={cn(
          "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-accent",
          active
            ? "border-accent/40 bg-accent/15"
            : "border-accent/20 bg-accent/5",
        )}
      >
        <MessageSquare size={14} aria-hidden />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="line-clamp-2 font-geistMono text-[13px] leading-snug text-textPrimary">
          {previewText(c)}
        </span>
        <div className="flex items-center gap-2 font-geistMono text-[10px] text-textMuted">
          <span>{formatRelative(c.timestamp)}</span>
          {voice && (
            <>
              <span aria-hidden>·</span>
              <span className="text-accent">{voice.name}</span>
            </>
          )}
        </div>
      </div>
    </motion.button>
  );
}

interface HistoryBodyProps extends HistoryProps {
  /** Rendered as the close affordance on mobile; null on desktop rail. */
  closeButton?: React.ReactNode;
  /** Persist between mounts so confirm-clear timeout survives. Sheet provides false. */
  isOpen: boolean;
}

function HistoryBody({
  onSelect,
  onNewChat,
  activeId,
  closeButton,
  isOpen,
}: HistoryBodyProps) {
  const { conversations, clearHistory, hydrated } = useConversationHistory();
  const pathname = usePathname();
  const [confirmClear, setConfirmClear] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsActive = pathname?.startsWith("/settings") ?? false;

  // GSAP first-mount reveal: slide the sidebar's primary sections in
  // with a tight stagger. Runs once per mount of this body, NOT on every
  // route change (since the body itself is owned by WorkspaceShell and
  // stays mounted).
  const bodyRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!bodyRef.current) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets =
      bodyRef.current.querySelectorAll<HTMLElement>("[data-sidebar-reveal]");
    if (!targets.length) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, x: -10 },
        {
          opacity: 1,
          x: 0,
          duration: 0.45,
          stagger: 0.06,
          ease: "power3.out",
          clearProps: "transform,opacity,willChange",
        },
      );
    }, bodyRef.current);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setConfirmClear(false);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  const handleClear = useCallback(() => {
    if (!confirmClear) {
      setConfirmClear(true);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    clearHistory();
    setConfirmClear(false);
  }, [confirmClear, clearHistory]);

  return (
    <div ref={bodyRef} className="flex h-full min-h-0 flex-col">
      <header
        data-sidebar-reveal
        className="flex items-center justify-between gap-2 px-4 py-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        <Link
          href="/"
          aria-label="VoiceAI home"
          className="group inline-flex items-center gap-2 rounded-md py-1 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span
            aria-hidden
            className="anim-accent-pulse h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_var(--accent-glow)]"
          />
          <span className="font-syne text-base font-bold leading-none tracking-wide text-textPrimary">
            VoiceAI
          </span>
        </Link>
        {closeButton}
      </header>

      <div data-sidebar-reveal className="px-3 pb-3">
        <button
          type="button"
          onClick={onNewChat}
          className={cn(
            "flex h-11 w-full items-center justify-center gap-2 rounded-lg",
            "border border-accent/30 bg-accent/10 font-geistMono text-xs font-semibold text-accent",
            "transition-all duration-200 hover:bg-accent/15 hover:shadow-[0_0_24px_var(--accent-glow)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            "active:scale-[0.98]",
          )}
        >
          <Plus size={14} aria-hidden />
          New chat
        </button>
      </div>

      <div
        data-sidebar-reveal
        className="flex items-center justify-between px-4 pb-2 pt-1"
        aria-hidden
      >
        <span className="font-geistMono text-[10px] uppercase tracking-[0.18em] text-textMuted">
          Conversations
        </span>
      </div>

      <ScrollArea data-sidebar-reveal className="flex-1 px-3 pb-3">
        {!hydrated ? (
          <div className="flex flex-col gap-2 px-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[72px] animate-pulse rounded-lg border border-borderSoft bg-bgCard"
              />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-textMuted">
            <Clock size={28} strokeWidth={1.5} aria-hidden />
            <p className="font-syne text-sm font-semibold text-textPrimary">
              No conversations yet
            </p>
            <p className="max-w-[16rem] font-geistMono text-[11px] leading-relaxed text-textMuted">
              Tap the mic, say something, and it&apos;ll show up here.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {conversations.map((c) => (
                <li key={c.id}>
                  <ConversationRow
                    c={c}
                    active={c.id === activeId}
                    onClick={() => onSelect(c)}
                  />
                </li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </ScrollArea>

      {hydrated && conversations.length > 0 && (
        <div className="px-3 pb-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClear}
            className={cn(
              "h-10 w-full justify-start gap-2 rounded-lg font-geistMono text-xs",
              confirmClear
                ? "bg-error/10 text-error hover:bg-error/15 hover:text-error"
                : "text-textMuted hover:bg-bgCard hover:text-textPrimary",
            )}
          >
            <Trash2 size={14} aria-hidden />
            {confirmClear ? "Tap again to confirm" : "Clear all"}
          </Button>
        </div>
      )}

      <div
        data-sidebar-reveal
        className="border-t border-borderSoft px-3 py-3"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)",
        }}
      >
        <Link
          href="/settings"
          aria-current={settingsActive ? "page" : undefined}
          className={cn(
            "group relative flex h-11 w-full items-center gap-2 overflow-hidden rounded-lg px-3 font-geistMono text-xs transition-colors",
            settingsActive
              ? "bg-accent/10 text-accent"
              : "text-textPrimary hover:bg-bgCard hover:text-accent",
          )}
        >
          {settingsActive && (
            <motion.span
              layoutId="nav-active-rail"
              aria-hidden
              className="absolute left-0 top-1.5 h-[calc(100%-0.75rem)] w-[3px] rounded-r-full bg-accent shadow-[0_0_10px_var(--accent-glow)]"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            />
          )}
          <SettingsIcon
            size={14}
            aria-hidden
            className="transition-transform duration-200 group-hover:rotate-45"
          />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  );
}

export function HistoryDrawer({
  open,
  onOpenChange,
  onSelect,
  onNewChat,
  activeId,
}: HistoryDrawerProps) {
  const handleSelect = useCallback(
    (c: Conversation) => {
      onSelect(c);
      onOpenChange(false);
    },
    [onSelect, onOpenChange],
  );

  const handleNewChat = useCallback(() => {
    onNewChat?.();
    onOpenChange(false);
  }, [onNewChat, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className={cn(
          "flex w-[84%] max-w-[360px] flex-col gap-0 border-borderSoft bg-bgPrimary p-0",
          "shadow-[0_0_60px_var(--accent-glow)]",
          // Suppress shadcn's built-in absolute close button.
          "[&>button.absolute]:hidden",
        )}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Conversations</SheetTitle>
          <SheetDescription>
            Past voice conversations stored on this device.
          </SheetDescription>
        </SheetHeader>
        <HistoryBody
          onSelect={handleSelect}
          onNewChat={handleNewChat}
          activeId={activeId}
          isOpen={open}
          closeButton={
            <SheetClose
              aria-label="Close history"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-textMuted transition-colors hover:bg-bgCard hover:text-textPrimary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <X size={18} aria-hidden />
            </SheetClose>
          }
        />
      </SheetContent>
    </Sheet>
  );
}

/**
 * Permanent left rail. Visible on lg+ screens only; consumers should hide it on mobile.
 */
export function HistorySidebar({
  onSelect,
  onNewChat,
  activeId,
}: HistoryProps) {
  return (
    <aside
      aria-label="Conversations"
      className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-[300px] lg:flex-col lg:border-r lg:border-borderSoft lg:bg-bgPrimary"
    >
      <HistoryBody
        onSelect={onSelect}
        onNewChat={onNewChat}
        activeId={activeId}
        isOpen
      />
    </aside>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, MessageSquare, Trash2, X } from "lucide-react";
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

interface HistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when a row is tapped. Drawer closes automatically. */
  onSelect: (conversation: Conversation) => void;
  /** Highlighted row (current conversation being viewed). */
  activeId?: string | null;
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
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.18 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={cn(
        "group relative flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left",
        "transition-colors",
        active
          ? "border-accent/40 bg-accent/10"
          : "border-borderSoft bg-bgCard hover:border-accent/30 hover:bg-accent/5",
      )}
    >
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-2 h-[calc(100%-1rem)] w-[3px] rounded-r-full bg-accent shadow-[0_0_10px_var(--accent-glow)]"
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

export function HistoryDrawer({
  open,
  onOpenChange,
  onSelect,
  activeId,
}: HistoryDrawerProps) {
  const { conversations, clearHistory, hydrated } = useConversationHistory();
  const [confirmClear, setConfirmClear] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) {
      setConfirmClear(false);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    }
  }, [open]);

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

  const handleSelect = useCallback(
    (c: Conversation) => {
      onSelect(c);
      onOpenChange(false);
    },
    [onSelect, onOpenChange],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className={cn(
          "flex w-[84%] max-w-[360px] flex-col gap-0 border-borderSoft bg-bgPrimary p-0",
          "shadow-[0_0_60px_var(--accent-glow)]",
          // Suppress the built-in absolute close button from shadcn's SheetContent
          // so we can render a single, header-aligned close instead.
          "[&>button.absolute]:hidden",
        )}
      >
        <SheetHeader
          className="flex flex-row items-center justify-between gap-2 space-y-0 border-b border-borderSoft px-4 py-4 text-left"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
        >
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_var(--accent-glow)]"
            />
            <SheetTitle className="font-syne text-base font-bold leading-none text-textPrimary">
              Conversations
            </SheetTitle>
          </div>
          <SheetClose
            aria-label="Close history"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-textMuted transition-colors hover:bg-bgCard hover:text-textPrimary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X size={18} aria-hidden />
          </SheetClose>
        </SheetHeader>
        <SheetDescription className="sr-only">
          Past voice conversations stored on this device.
        </SheetDescription>

        <ScrollArea className="flex-1 px-3 py-3">
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
                      onClick={() => handleSelect(c)}
                    />
                  </li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </ScrollArea>

        {hydrated && conversations.length > 0 && (
          <div
            className="border-t border-borderSoft px-3 py-3"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
          >
            <Button
              type="button"
              variant="ghost"
              onClick={handleClear}
              className={cn(
                "h-11 w-full justify-start gap-2 rounded-lg font-geistMono text-xs",
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
      </SheetContent>
    </Sheet>
  );
}

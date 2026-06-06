"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Menu, Plus, History as HistoryIcon, Square } from "lucide-react";
import { OrbMicButton } from "@/components/OrbMicButton";
import { VoiceSelector } from "@/components/VoiceSelector";
import { MicPermissionSheet } from "@/components/MicPermissionSheet";
import { HistoryDrawer, HistorySidebar } from "@/components/HistoryDrawer";
import { useVoiceState } from "@/lib/useVoiceState";
import { useConversationHistory } from "@/lib/useConversationHistory";
import { useNetworkStatus } from "@/lib/useNetworkStatus";
import { useSettings } from "@/lib/useSettings";
import { useEdgeSwipe } from "@/lib/useEdgeSwipe";
import { DEFAULT_VOICE_ID } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Conversation, Message } from "@/lib/types";

const TranscriptArea = dynamic(
  () =>
    import("@/components/TranscriptArea").then((m) => ({
      default: m.TranscriptArea,
    })),
  { ssr: false },
);

export default function VoicePage() {
  // The live conversation in progress — always auto-saved on completion.
  const [liveMessages, setLiveMessages] = useState<Message[]>([]);
  // A past conversation being viewed (read-only). null = live mode.
  const [viewing, setViewing] = useState<Conversation | null>(null);
  const [permissionSheetOpen, setPermissionSheetOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { conversations, addConversation } = useConversationHistory();
  const { isOnline } = useNetworkStatus();
  const { settings, update, hydrated } = useSettings();
  const voice = hydrated ? settings.voiceId : DEFAULT_VOICE_ID;
  const setVoice = useCallback(
    (v: string) => update("voiceId", v),
    [update],
  );

  const handleConversationComplete = useCallback(
    (conversation: Conversation) => {
      // Always save the live turn; never mutate viewing state.
      setLiveMessages((prev) => [...prev, ...conversation.messages]);
      addConversation(conversation);
    },
    [addConversation],
  );

  const handleError = useCallback((message: string) => {
    toast.error(message);
  }, []);

  // Refs let onCycleEnd read the latest settings/startListening without
  // re-wiring the voice state machine on every render.
  const startListeningRef = useRef<() => void>(() => {});
  const handsFreeRef = useRef(false);
  handsFreeRef.current = hydrated ? settings.handsFree : false;

  const handleCycleEnd = useCallback(() => {
    if (!handsFreeRef.current) return;
    if (!isOnline) return;
    // Defer so the orb visibly returns to idle before kicking back to listening.
    setTimeout(() => startListeningRef.current(), 250);
  }, [isOnline]);

  const {
    state,
    transcript,
    interimTranscript,
    aiResponse,
    permissionError,
    startListening,
    stopListening,
    reset,
  } = useVoiceState({
    voiceId: voice,
    micSensitivity: settings.micSensitivity,
    autoStop: settings.autoStop,
    voiceEngine: settings.voiceEngine,
    onConversationComplete: handleConversationComplete,
    onError: handleError,
    onCycleEnd: handleCycleEnd,
  });

  startListeningRef.current = startListening;

  useEffect(() => {
    if (permissionError) {
      setPermissionSheetOpen(true);
    }
  }, [permissionError]);

  // Pick up a conversation chosen from another route (e.g. /settings sidebar)
  // or honor a "new chat" intent from those pages.
  useEffect(() => {
    let id: string | null = null;
    let newChat = false;
    try {
      id = sessionStorage.getItem("voiceai-resume-id");
      newChat = sessionStorage.getItem("voiceai-new-chat") === "1";
      if (id) sessionStorage.removeItem("voiceai-resume-id");
      if (newChat) sessionStorage.removeItem("voiceai-new-chat");
    } catch {
      return;
    }
    if (newChat) {
      setViewing(null);
      setLiveMessages([]);
      return;
    }
    if (!id || !conversations.length) return;
    const match = conversations.find((c) => c.id === id);
    if (match) setViewing(match);
  }, [conversations]);

  const openHistory = useCallback(() => setHistoryOpen(true), []);
  useEdgeSwipe({
    edge: "left",
    onSwipe: openHistory,
    disabled: historyOpen || state === "listening",
  });

  const handleSelectConversation = useCallback((c: Conversation) => {
    setViewing(c);
  }, []);

  const handleBackToLive = useCallback(() => {
    setViewing(null);
  }, []);

  const handleNewChat = useCallback(() => {
    setViewing(null);
    setLiveMessages([]);
  }, []);

  const handleMicPress = useCallback(() => {
    if (!isOnline) {
      toast.error("You're offline — voice features need an internet connection.");
      return;
    }
    // Speaking always operates on the live thread. Exit viewing mode first.
    if (viewing) setViewing(null);
    if (state === "idle") startListening();
    else if (state === "listening") stopListening();
    else if (state === "processing" || state === "speaking") reset();
  }, [isOnline, state, startListening, stopListening, reset, viewing]);

  const displayMessages = useMemo<Message[]>(() => {
    // When viewing a past chat, show only its messages (read-only).
    if (viewing) return viewing.messages;

    // Live mode: persisted turns plus the in-flight transcript/response.
    const pending: Message[] = [];
    if (state === "processing" || state === "speaking") {
      if (transcript) {
        pending.push({
          id: "live-user",
          role: "user",
          content: transcript,
          timestamp: Date.now(),
        });
      }
      if (aiResponse) {
        pending.push({
          id: "live-assistant",
          role: "assistant",
          content: aiResponse,
          timestamp: Date.now(),
        });
      }
    }
    return [...liveMessages, ...pending];
  }, [viewing, liveMessages, state, transcript, aiResponse]);

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex h-[100dvh] flex-col overflow-hidden lg:ml-[300px]"
    >
      <h1 className="sr-only">VoiceAI — Talk to AI</h1>
      <HistorySidebar
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        activeId={viewing?.id ?? null}
      />
      {!isOnline && (
        <div
          role="alert"
          className="w-full bg-error/10 px-4 py-2 text-center font-geistMono text-xs text-error"
        >
          No internet connection — voice unavailable
        </div>
      )}

      <header
        className="flex items-center justify-between gap-3 px-4 pt-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        <button
          type="button"
          onClick={openHistory}
          aria-label="Open conversation history"
          aria-expanded={historyOpen}
          aria-controls="history-drawer"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-borderSoft bg-bgCard text-textPrimary transition-colors hover:border-accent/30 hover:text-accent lg:hidden"
        >
          <Menu size={20} aria-hidden />
        </button>
        <VoiceSelector value={voice} onChange={setVoice} />
      </header>

      <AnimatePresence initial={false}>
        {viewing && (
          <motion.div
            key="viewing-pill"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-full border border-accent/25 bg-accent/5 px-3 py-2"
            role="status"
          >
            <div className="flex min-w-0 items-center gap-2">
              <HistoryIcon size={14} className="shrink-0 text-accent" aria-hidden />
              <span className="truncate font-geistMono text-[11px] text-textMuted">
                Viewing past chat ·{" "}
                <span className="text-textPrimary">
                  {new Date(viewing.timestamp).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={handleBackToLive}
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-accent px-3 font-geistMono text-[11px] font-semibold text-bgPrimary transition-colors hover:bg-accent/90"
            >
              <Plus size={12} aria-hidden />
              {liveMessages.length > 0 ? "Back to live" : "New chat"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orb + status label + stop pill. Label always present so the
          user can tell which phase they're in without reading orb hue. */}
      <section className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
        <OrbMicButton
          state={state}
          onClick={handleMicPress}
          disabled={!isOnline && state === "idle"}
        />
        <p
          role="status"
          aria-live="polite"
          className={cn(
            "font-geistMono text-[11px] uppercase tracking-[0.22em] transition-colors",
            state === "listening" && "text-accent",
            state === "processing" && "text-textMuted",
            state === "speaking" && "text-success",
            state === "idle" && "text-textMuted",
          )}
        >
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                state === "listening" && "animate-pulse bg-accent shadow-[0_0_8px_var(--accent-glow)]",
                state === "processing" && "animate-pulse bg-textMuted",
                state === "speaking" && "bg-success shadow-[0_0_8px_rgba(0,255,136,0.4)]",
                state === "idle" && "bg-textMuted/40",
              )}
            />
            {state === "idle" && "Tap to talk"}
            {state === "listening" && "Listening"}
            {state === "processing" && "Thinking"}
            {state === "speaking" && "Speaking"}
          </span>
        </p>
        <AnimatePresence initial={false}>
          {(state === "processing" || state === "speaking") && (
            <motion.button
              key="stop-pill"
              type="button"
              onClick={reset}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              aria-label={
                state === "speaking"
                  ? "Stop speaking"
                  : "Cancel response"
              }
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-borderSoft bg-bgCard px-5 font-geistMono text-xs text-textPrimary transition-colors hover:border-error/40 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bgPrimary"
            >
              <Square size={12} aria-hidden fill="currentColor" />
              {state === "speaking" ? "Stop" : "Cancel"}
            </motion.button>
          )}
        </AnimatePresence>
      </section>

      <section className="px-4 pb-2">
        <TranscriptArea
          messages={displayMessages}
          interimText={state === "listening" ? interimTranscript : ""}
        />
      </section>

      <MicPermissionSheet
        open={permissionSheetOpen}
        onOpenChange={setPermissionSheetOpen}
      />

      <HistoryDrawer
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        activeId={viewing?.id ?? null}
      />
    </motion.main>
  );
}

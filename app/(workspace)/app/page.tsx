"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Menu, Plus, History as HistoryIcon, Square } from "lucide-react";
import { OrbMicButton } from "@/components/OrbMicButton";
import { VoiceSelector } from "@/components/VoiceSelector";
import { MicPermissionSheet } from "@/components/MicPermissionSheet";
import { useVoiceState } from "@/lib/useVoiceState";
import { useConversationHistory } from "@/lib/useConversationHistory";
import { useNetworkStatus } from "@/lib/useNetworkStatus";
import { useSettings } from "@/lib/useSettings";
import { DEFAULT_VOICE_ID } from "@/lib/constants";
import { useGsapReveal } from "@/lib/useGsapReveal";
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
  const [liveMessages, setLiveMessages] = useState<Message[]>([]);
  const [viewing, setViewing] = useState<Conversation | null>(null);
  const [permissionSheetOpen, setPermissionSheetOpen] = useState(false);
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
      setLiveMessages((prev) => [...prev, ...conversation.messages]);
      addConversation(conversation);
    },
    [addConversation],
  );

  const handleError = useCallback((message: string) => {
    toast.error(message);
  }, []);

  const startListeningRef = useRef<() => void>(() => {});
  const handsFreeRef = useRef(false);
  handsFreeRef.current = hydrated ? settings.handsFree : false;

  const handleCycleEnd = useCallback(() => {
    if (!handsFreeRef.current) return;
    if (!isOnline) return;
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

  // Pick up a conversation chosen from the sidebar or honor a "new chat"
  // intent. Listens to both sessionStorage (cross-route) and live events
  // (same-route taps), so a sidebar click reliably mutates page state.
  const applyResumeIntent = useCallback(() => {
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
    if (!id) return;
    const match = conversations.find((c) => c.id === id);
    if (match) setViewing(match);
  }, [conversations]);

  useEffect(() => {
    applyResumeIntent();
  }, [applyResumeIntent]);

  useEffect(() => {
    const resumeHandler = () => applyResumeIntent();
    const newChatHandler = () => {
      setViewing(null);
      setLiveMessages([]);
      try {
        sessionStorage.removeItem("voiceai-new-chat");
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("voiceai:resume", resumeHandler);
    window.addEventListener("voiceai:new-chat", newChatHandler);
    return () => {
      window.removeEventListener("voiceai:resume", resumeHandler);
      window.removeEventListener("voiceai:new-chat", newChatHandler);
    };
  }, [applyResumeIntent]);

  const openDrawer = useCallback(() => {
    window.dispatchEvent(new CustomEvent("voiceai:open-drawer"));
  }, []);

  const handleBackToLive = useCallback(() => {
    setViewing(null);
  }, []);

  const handleMicPress = useCallback(() => {
    if (!isOnline) {
      toast.error(
        "You're offline — voice features need an internet connection.",
      );
      return;
    }
    if (viewing) setViewing(null);
    if (state === "idle") startListening();
    else if (state === "listening") stopListening();
    else if (state === "processing" || state === "speaking") reset();
  }, [isOnline, state, startListening, stopListening, reset, viewing]);

  const displayMessages = useMemo<Message[]>(() => {
    if (viewing) return viewing.messages;
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

  // Stagger the header + orb + transcript on first paint and on route entry.
  // Only animates direct [data-reveal] descendants of the container.
  const revealRef = useGsapReveal<HTMLDivElement>({
    y: 14,
    stagger: 0.08,
    duration: 0.55,
  });

  return (
    <main
      ref={revealRef}
      className="flex h-[100dvh] flex-col overflow-hidden"
    >
      <h1 className="sr-only">VoiceAI — Talk to AI</h1>
      {!isOnline && (
        <div
          role="alert"
          data-reveal
          className="w-full bg-error/10 px-4 py-2 text-center font-geistMono text-xs text-error"
        >
          No internet connection — voice unavailable
        </div>
      )}

      <header
        data-reveal
        className="flex items-center justify-between gap-3 px-4 pt-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        <button
          type="button"
          onClick={openDrawer}
          aria-label="Open conversation history"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-borderSoft bg-bgCard text-textPrimary transition-all hover:border-accent/30 hover:text-accent hover:shadow-[0_0_18px_var(--accent-glow)] active:scale-95 lg:hidden"
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
              <HistoryIcon
                size={14}
                className="shrink-0 text-accent"
                aria-hidden
              />
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

      <section
        data-reveal
        className="flex flex-1 flex-col items-center justify-center gap-3 px-4"
      >
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
                state === "listening" &&
                  "animate-pulse bg-accent shadow-[0_0_8px_var(--accent-glow)]",
                state === "processing" && "animate-pulse bg-textMuted",
                state === "speaking" &&
                  "bg-success shadow-[0_0_8px_rgba(0,255,136,0.4)]",
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
                state === "speaking" ? "Stop speaking" : "Cancel response"
              }
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-borderSoft bg-bgCard px-5 font-geistMono text-xs text-textPrimary transition-colors hover:border-error/40 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bgPrimary"
            >
              <Square size={12} aria-hidden fill="currentColor" />
              {state === "speaking" ? "Stop" : "Cancel"}
            </motion.button>
          )}
        </AnimatePresence>
      </section>

      <section data-reveal className="px-4 pb-2">
        <TranscriptArea
          messages={displayMessages}
          interimText={state === "listening" ? interimTranscript : ""}
        />
      </section>

      <MicPermissionSheet
        open={permissionSheetOpen}
        onOpenChange={setPermissionSheetOpen}
      />
    </main>
  );
}

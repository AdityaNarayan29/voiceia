"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { MicButton } from "@/components/MicButton";
import { Waveform } from "@/components/Waveform";
import { StatusPill } from "@/components/StatusPill";
import { VoiceSelector } from "@/components/VoiceSelector";
import { BottomNav } from "@/components/BottomNav";
import { MicPermissionSheet } from "@/components/MicPermissionSheet";
import { useVoiceState } from "@/lib/useVoiceState";
import { useConversationHistory } from "@/lib/useConversationHistory";
import { useNetworkStatus } from "@/lib/useNetworkStatus";
import { useSettings } from "@/lib/useSettings";
import { DEFAULT_VOICE_ID } from "@/lib/constants";
import type { Conversation, Message } from "@/lib/types";

const TranscriptArea = dynamic(
  () =>
    import("@/components/TranscriptArea").then((m) => ({
      default: m.TranscriptArea,
    })),
  { ssr: false },
);

export default function VoicePage() {
  const [sessionMessages, setSessionMessages] = useState<Message[]>([]);
  const [permissionSheetOpen, setPermissionSheetOpen] = useState(false);
  const { addConversation } = useConversationHistory();
  const { isOnline } = useNetworkStatus();
  const { settings, update, hydrated } = useSettings();
  const voice = hydrated ? settings.voiceId : DEFAULT_VOICE_ID;
  const setVoice = useCallback(
    (v: string) => update("voiceId", v),
    [update],
  );

  const handleConversationComplete = useCallback(
    (conversation: Conversation) => {
      setSessionMessages((prev) => [...prev, ...conversation.messages]);
      addConversation(conversation);
    },
    [addConversation],
  );

  const handleError = useCallback((message: string) => {
    toast.error(message);
  }, []);

  const {
    state,
    transcript,
    interimTranscript,
    aiResponse,
    permissionError,
    micLevel,
    startListening,
    stopListening,
  } = useVoiceState({
    voiceId: voice,
    micSensitivity: settings.micSensitivity,
    autoStop: settings.autoStop,
    onConversationComplete: handleConversationComplete,
    onError: handleError,
  });

  useEffect(() => {
    if (permissionError) {
      setPermissionSheetOpen(true);
    }
  }, [permissionError]);

  const handleMicPress = useCallback(() => {
    if (!isOnline) {
      toast.error("You're offline — voice features need an internet connection.");
      return;
    }
    if (state === "idle") startListening();
    else if (state === "listening") stopListening();
  }, [isOnline, state, startListening, stopListening]);

  const displayMessages = useMemo<Message[]>(() => {
    const live: Message[] = [];
    if (state === "processing" || state === "speaking") {
      if (transcript) {
        live.push({
          id: "live-user",
          role: "user",
          content: transcript,
          timestamp: Date.now(),
        });
      }
      if (aiResponse) {
        live.push({
          id: "live-assistant",
          role: "assistant",
          content: aiResponse,
          timestamp: Date.now(),
        });
      }
    }
    return [...sessionMessages, ...live];
  }, [sessionMessages, state, transcript, aiResponse]);

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex h-[100dvh] flex-col overflow-hidden"
    >
      {!isOnline && (
        <div
          role="alert"
          className="w-full bg-error/10 px-4 py-2 text-center font-geistMono text-xs text-error"
        >
          No internet connection — voice unavailable
        </div>
      )}

      <header
        className="flex items-center justify-between px-6 pt-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        <span className="font-syne text-sm font-semibold text-textMuted">
          VoiceAI
        </span>
        <VoiceSelector value={voice} onChange={setVoice} />
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-8 px-4">
        <Waveform state={state} level={micLevel} />
        <MicButton
          state={state}
          onClick={handleMicPress}
          disabled={!isOnline && state === "idle"}
        />
        <StatusPill state={state} />
      </section>

      <section className="px-4 pb-2">
        <TranscriptArea
          messages={displayMessages}
          interimText={state === "listening" ? interimTranscript : ""}
        />
      </section>

      <div className="pb-[80px]" />
      <BottomNav />

      <MicPermissionSheet
        open={permissionSheetOpen}
        onOpenChange={setPermissionSheetOpen}
      />
    </motion.main>
  );
}

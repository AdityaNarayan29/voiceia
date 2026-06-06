"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { Conversation, Message, VoiceAction, VoiceStateShape } from "@/lib/types";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { useAudioRecorder } from "@/lib/useAudioRecorder";
import { useAudioPlayer } from "@/lib/useAudioPlayer";
import { useSpeechSynthesis } from "@/lib/useSpeechSynthesis";
import { useStreamingAudioPlayer } from "@/lib/useStreamingAudioPlayer";
import { isKokoroConfigured, kokoroSpeak } from "@/lib/kokoroClient";
import { classifyError } from "@/lib/errorMessages";

const initialState: VoiceStateShape = {
  state: "idle",
  transcript: "",
  aiResponse: "",
  isAnimating: false,
};

function reducer(state: VoiceStateShape, action: VoiceAction): VoiceStateShape {
  switch (action.type) {
    case "START_LISTENING":
      return { ...state, state: "listening", isAnimating: true };
    case "STOP_LISTENING":
      return { ...state, state: "processing" };
    case "SET_PROCESSING":
      return { ...state, state: "processing" };
    case "SET_SPEAKING":
      return { ...state, state: "speaking" };
    case "RESET":
      return initialState;
    case "SET_TRANSCRIPT":
      return { ...state, transcript: action.payload };
    case "SET_RESPONSE":
      return { ...state, aiResponse: action.payload };
    default:
      return state;
  }
}

export interface UseVoiceStateOptions {
  voiceId: string;
  /** 0–100; controls input gain + VAD silence floor. */
  micSensitivity?: number;
  /** If true, silence after speech auto-stops listening. */
  autoStop?: boolean;
  /** TTS engine: "system" (fast, browser) or "kokoro" (high-quality, local). */
  voiceEngine?: "system" | "kokoro";
  onConversationComplete?: (conversation: Conversation) => void;
  onError?: (message: string) => void;
  /** Fires after a turn ends naturally (TTS done). Not called on cancel/error. */
  onCycleEnd?: () => void;
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useVoiceState(options: UseVoiceStateOptions) {
  const {
    voiceId,
    micSensitivity = 75,
    autoStop = true,
    voiceEngine = "system",
    onConversationComplete,
    onError,
    onCycleEnd,
  } = options;

  const [voice, dispatch] = useReducer(reducer, initialState);
  const [permissionError, setPermissionError] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const stateRef = useRef(voice.state);
  const finalSeenRef = useRef("");
  const cancelledRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const partialAbortRef = useRef<AbortController | null>(null);
  const partialInFlightRef = useRef(false);
  const sessionHistoryRef = useRef<Message[]>([]);
  const cycleStartRef = useRef<number>(0);
  const voiceIdRef = useRef(voiceId);
  const sensitivityRef = useRef(micSensitivity);
  const autoStopRef = useRef(autoStop);
  const voiceEngineRef = useRef(voiceEngine);
  const optionsRef = useRef({ onConversationComplete, onError, onCycleEnd });

  stateRef.current = voice.state;
  voiceIdRef.current = voiceId;
  sensitivityRef.current = micSensitivity;
  autoStopRef.current = autoStop;
  voiceEngineRef.current = voiceEngine;
  optionsRef.current = { onConversationComplete, onError, onCycleEnd };

  const speech = useSpeechRecognition();
  const recorder = useAudioRecorder();
  const player = useAudioPlayer();
  const synth = useSpeechSynthesis();
  const streamingPlayer = useStreamingAudioPlayer();

  // Web Speech where supported (Chrome, Edge, Brave-with-toggle, Android Chrome):
  // instant interim transcripts, no network round-trip.
  // MediaRecorder + Groq Whisper fallback for Safari/Firefox/Brave-default:
  // ~1.5s lag with partial transcripts.
  const useWebSpeech = speech.isSupported;

  const reportError = useCallback((message: string) => {
    optionsRef.current.onError?.(message);
  }, []);

  const completeConversation = useCallback(
    (transcript: string, response: string) => {
      const completedAt = Date.now();
      const durationSec = Math.max(
        1,
        Math.round((completedAt - cycleStartRef.current) / 1000),
      );
      const userMsg: Message = {
        id: newId("u"),
        role: "user",
        content: transcript,
        timestamp: cycleStartRef.current || completedAt,
      };
      const aiMsg: Message = {
        id: newId("a"),
        role: "assistant",
        content: response,
        timestamp: completedAt,
      };
      sessionHistoryRef.current = [
        ...sessionHistoryRef.current,
        userMsg,
        aiMsg,
      ];
      const conversation: Conversation = {
        id: newId("c"),
        timestamp: cycleStartRef.current || completedAt,
        duration: durationSec,
        voice: voiceIdRef.current,
        messages: [userMsg, aiMsg],
      };
      optionsRef.current.onConversationComplete?.(conversation);
    },
    [],
  );

  const processVoice = useCallback(
    async (transcript: string) => {
      cancelledRef.current = false;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      dispatch({ type: "SET_TRANSCRIPT", payload: transcript });
      dispatch({ type: "SET_PROCESSING" });

      // STEP 1: stream LLM response
      let chatRes: Response;
      try {
        chatRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            message: transcript,
            voiceId: voiceIdRef.current,
            history: sessionHistoryRef.current,
          }),
          signal: controller.signal,
        });
      } catch (e) {
        if (controller.signal.aborted) return;
        reportError(classifyError(e).title);
        dispatch({ type: "RESET" });
        return;
      }

      if (!chatRes.ok || !chatRes.body) {
        const text = await chatRes.text().catch(() => "");
        reportError(classifyError(text || `HTTP ${chatRes.status}`).title);
        dispatch({ type: "RESET" });
        return;
      }

      const reader = chatRes.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      try {
        while (true) {
          if (cancelledRef.current) {
            reader.cancel().catch(() => {});
            return;
          }
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (!chunk) continue;
          accumulated += chunk;
          dispatch({ type: "SET_RESPONSE", payload: accumulated });
        }
      } catch (e) {
        reportError(classifyError(e).title);
        dispatch({ type: "RESET" });
        return;
      }

      const finalResponse = accumulated.trim();
      if (!finalResponse) {
        reportError("Voice service hiccup");
        dispatch({ type: "RESET" });
        return;
      }
      if (cancelledRef.current) return;

      // STEP 2: TTS — engine choice driven by Settings.
      const finishCycle = () => {
        if (cancelledRef.current) return;
        completeConversation(transcript, finalResponse);
        dispatch({ type: "RESET" });
        finalSeenRef.current = "";
        optionsRef.current.onCycleEnd?.();
      };

      const playWithSynth = () => {
        if (!synth.isSupported) {
          // No audio path available. Still complete (text saved).
          finishCycle();
          return;
        }
        dispatch({ type: "SET_SPEAKING" });
        synth.setOnEnd(finishCycle);
        const started = synth.speak(finalResponse, voiceIdRef.current);
        if (!started) finishCycle();
      };

      // User chose system voice, OR Kokoro isn't configured.
      if (voiceEngineRef.current === "system" || !isKokoroConfigured()) {
        playWithSynth();
        return;
      }

      // Kokoro path. On any failure, fall back to system voice so the
      // conversation never silently hangs.
      let speakRes: Response;
      try {
        speakRes = await kokoroSpeak({
          text: finalResponse,
          voiceId: voiceIdRef.current,
          signal: controller.signal,
        });
      } catch (e) {
        if (controller.signal.aborted) return;
        console.warn(
          "Kokoro TTS unreachable, falling back to system voice:",
          e instanceof Error ? e.message : e,
        );
        playWithSynth();
        return;
      }

      if (cancelledRef.current) return;

      dispatch({ type: "SET_SPEAKING" });
      streamingPlayer.setOnEnd(finishCycle);
      try {
        await streamingPlayer.playStream(speakRes, "audio/mpeg");
      } catch (e) {
        console.warn(
          "Streaming playback failed, falling back to system voice:",
          e instanceof Error ? e.message : e,
        );
        playWithSynth();
      }
    },
    [synth, streamingPlayer, reportError, completeConversation],
  );

  useEffect(() => {
    if (!useWebSpeech) return;
    const final = speech.finalTranscript.trim();
    if (
      final &&
      final !== finalSeenRef.current &&
      stateRef.current === "listening"
    ) {
      finalSeenRef.current = final;
      void processVoice(final);
    }
  }, [speech.finalTranscript, useWebSpeech, processVoice]);

  useEffect(() => {
    if (!useWebSpeech) return;
    if (
      !speech.isListening &&
      stateRef.current === "listening" &&
      !finalSeenRef.current
    ) {
      dispatch({ type: "RESET" });
    }
  }, [speech.isListening, useWebSpeech]);

  useEffect(() => {
    const err = speech.error || recorder.error;
    if (!err) return;
    const friendly = classifyError(err);
    if (friendly.isPermissionIssue) {
      setPermissionError(true);
      return;
    }
    // Non-permission speech/recorder errors are worth surfacing too,
    // but as a toast rather than the big sheet. "no-speech" is normal,
    // not worth bothering the user.
    if (friendly.category !== "no-speech" && friendly.category !== "unknown") {
      reportError(friendly.title);
    }
  }, [speech.error, recorder.error, reportError]);

  const stopListeningRef = useRef<() => Promise<void>>(async () => {});

  const transcribePartial = useCallback(async (blob: Blob) => {
    if (partialInFlightRef.current) return; // skip overlapping cycles
    if (stateRef.current !== "listening") return;
    partialInFlightRef.current = true;
    partialAbortRef.current?.abort();
    const controller = new AbortController();
    partialAbortRef.current = controller;
    try {
      const form = new FormData();
      form.append("audio", blob, "partial.webm");
      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      if (!res.ok) return;
      const data = (await res.json()) as { transcript?: string };
      const text = (data.transcript ?? "").trim();
      if (controller.signal.aborted) return;
      if (stateRef.current === "listening" && text) {
        setLiveTranscript(text);
      }
    } catch {
      // partial transcribe failures are non-fatal; ignore
    } finally {
      partialInFlightRef.current = false;
    }
  }, []);

  const startListening = useCallback(async () => {
    cancelledRef.current = false;
    abortRef.current?.abort();
    abortRef.current = null;
    partialAbortRef.current?.abort();
    partialAbortRef.current = null;
    partialInFlightRef.current = false;
    finalSeenRef.current = "";
    setPermissionError(false);
    setLiveTranscript("");
    cycleStartRef.current = Date.now();

    if (useWebSpeech) {
      dispatch({ type: "START_LISTENING" });
      speech.startListening();
    } else {
      try {
        await recorder.startRecording({
          sensitivity: sensitivityRef.current,
          autoStop: autoStopRef.current,
          onSilence: () => {
            if (stateRef.current === "listening") {
              void stopListeningRef.current();
            }
          },
          partialIntervalMs: 1500,
          onPartialAudio: (blob) => {
            void transcribePartial(blob);
          },
        });
        if (recorder.error) {
          dispatch({ type: "RESET" });
          return;
        }
        dispatch({ type: "START_LISTENING" });
      } catch {
        dispatch({ type: "RESET" });
      }
    }
  }, [useWebSpeech, speech, recorder, transcribePartial]);

  const stopListening = useCallback(async () => {
    if (stateRef.current !== "listening") return;

    if (useWebSpeech) {
      speech.stopListening();
      return;
    }

    // Cancel any in-flight partial transcribe — final transcribe is authoritative.
    partialAbortRef.current?.abort();
    partialAbortRef.current = null;
    partialInFlightRef.current = false;

    dispatch({ type: "STOP_LISTENING" });
    const blob = await recorder.stopRecording();
    if (!blob) {
      dispatch({ type: "RESET" });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let transcribeRes: Response;
    try {
      const form = new FormData();
      form.append("audio", blob, "audio.webm");
      transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
    } catch (e) {
      if (controller.signal.aborted) return;
      reportError(classifyError(e).title);
      dispatch({ type: "RESET" });
      return;
    }

    if (!transcribeRes.ok) {
      const text = await transcribeRes.text().catch(() => "");
      reportError(classifyError(text || `HTTP ${transcribeRes.status}`).title);
      dispatch({ type: "RESET" });
      return;
    }

    const data = (await transcribeRes.json()) as { transcript?: string };
    const transcript = (data.transcript ?? "").trim();
    if (!transcript) {
      dispatch({ type: "RESET" });
      return;
    }
    finalSeenRef.current = transcript;
    void processVoice(transcript);
  }, [useWebSpeech, speech, recorder, processVoice, reportError]);

  stopListeningRef.current = stopListening;

  const reset = useCallback(() => {
    cancelledRef.current = true;
    abortRef.current?.abort();
    abortRef.current = null;
    partialAbortRef.current?.abort();
    partialAbortRef.current = null;
    partialInFlightRef.current = false;
    // Preserve the partial turn: if the user said something this cycle, save
    // it (along with whatever of the reply streamed in) so cancel acts as
    // "stop", not "discard". Drop turns with no user transcript yet.
    const partialUser = voice.transcript.trim();
    const partialAi = voice.aiResponse.trim();
    if (partialUser) {
      completeConversation(
        partialUser,
        partialAi || "(response canceled)",
      );
    }
    finalSeenRef.current = "";
    setPermissionError(false);
    setLiveTranscript("");
    speech.reset();
    player.stop();
    synth.stop();
    streamingPlayer.stop();
    dispatch({ type: "RESET" });
  }, [speech, player, synth, streamingPlayer, voice.transcript, voice.aiResponse, completeConversation]);

  // Unmount-only cleanup. Empty deps + ref reads = runs exactly once on unmount.
  // (Previously had `[player]` which re-fired every render because useAudioPlayer's
  // return object identity changes, aborting in-flight chat/tts fetches mid-cycle.)
  const playerRef = useRef(player);
  const synthRef = useRef(synth);
  const streamingPlayerRef = useRef(streamingPlayer);
  playerRef.current = player;
  synthRef.current = synth;
  streamingPlayerRef.current = streamingPlayer;
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      abortRef.current?.abort();
      abortRef.current = null;
      partialAbortRef.current?.abort();
      partialAbortRef.current = null;
      playerRef.current.stop();
      synthRef.current.stop();
      streamingPlayerRef.current.stop();
    };
  }, []);

  return {
    state: voice.state,
    transcript: voice.transcript,
    interimTranscript: liveTranscript || speech.interimTranscript,
    aiResponse: voice.aiResponse,
    isAnimating: voice.isAnimating,
    permissionError,
    isSupported: useWebSpeech || typeof window !== "undefined",
    micLevel: recorder.level,
    startListening,
    stopListening,
    reset,
  };
}

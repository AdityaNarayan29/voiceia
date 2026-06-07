"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface SpeechSynthesisHook {
  isSupported: boolean;
  isSpeaking: boolean;
  speak: (text: string, voiceId: string) => boolean;
  /** Prime speechSynthesis from inside a user gesture (see useStreamingAudioPlayer.unlock). */
  unlock: () => void;
  stop: () => void;
  setOnEnd: (cb: (() => void) | null) => void;
}

/**
 * Each voice ID maps to candidate system voice names, ordered by preference.
 * speechSynthesis voices vary wildly by OS/browser, so we try multiple fallbacks.
 */
const VOICE_CANDIDATES: Record<string, string[]> = {
  calm: ["Samantha", "Karen", "Tessa", "Google US English", "Microsoft Aria"],
  energetic: ["Allison", "Veena", "Google UK English Female", "Microsoft Jenny"],
  warm: ["Moira", "Fiona", "Karen", "Google UK English Female"],
  confident: ["Daniel", "Alex", "Google UK English Male", "Microsoft Guy"],
  smooth: ["Alex", "Daniel", "Tom", "Google US English", "Microsoft Davis"],
};

// macOS ships dozens of "novelty" voices (Albert, Bad News, Bells,
// Boing, Bubbles, Cellos, Fred, Pipe Organ, Trinoids, Whisper, Zarvox,
// etc.) that are localService=true but don't produce intelligible
// speech — they're sound effects. Chrome's speechSynthesis picks them
// silently and wedges. Whitelist the real speech voices instead of
// blacklisting the novelty ones (the novelty list keeps growing).
const REAL_VOICES: string[] = [
  // macOS real speech voices (en-US, en-GB, en-AU, en-IN, etc.)
  "Samantha", "Allison", "Ava", "Susan", "Vicki", "Victoria",
  "Karen", "Moira", "Tessa", "Fiona", "Veena", "Rishi", "Sangeeta",
  "Daniel", "Alex", "Tom", "Aaron", "Nicky", "Junior", "Ralph",
  "Kathy", "Princess", "Agnes",
  // Windows
  "Microsoft Aria", "Microsoft Jenny", "Microsoft Guy",
  "Microsoft Davis", "Microsoft David", "Microsoft Zira", "Microsoft Mark",
  // Linux / generic
  "English (America)", "English (Great Britain)",
];

function isRealSpeechVoice(v: SpeechSynthesisVoice): boolean {
  // Direct allowlist match (covers both exact names and the "(English…)"
  // variants that some Apple voices ship as).
  for (const name of REAL_VOICES) {
    if (v.name === name) return true;
    if (v.name.startsWith(name + " ")) return true; // "Samantha (Enhanced)"
    if (v.name.includes("(" + name + ")")) return true;
  }
  return false;
}

function pickVoice(
  voiceId: string,
  available: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  if (available.length === 0) return null;
  const candidates = VOICE_CANDIDATES[voiceId] ?? VOICE_CANDIDATES.calm;

  // Local voices only. Network voices on Chrome silently wedge
  // (synth.speaking=true, onstart never fires).
  const local = available.filter((v) => v.localService);
  const realLocal = local.filter(isRealSpeechVoice);

  // PASS 1: candidate match within real local voices (best case —
  // we get the requested character like Samantha or Allison).
  for (const name of candidates) {
    const exact = realLocal.find((v) => v.name === name);
    if (exact) return exact;
    const partial = realLocal.find((v) => v.name.includes(name));
    if (partial) return partial;
  }

  // PASS 2: any real local en-US, then any real local English.
  const enUS = realLocal.find(
    (v) => v.lang === "en-US" || v.lang === "en_US",
  );
  if (enUS) return enUS;
  const en = realLocal.find((v) =>
    v.lang.toLowerCase().startsWith("en"),
  );
  if (en) return en;

  // PASS 3: any real local voice (non-English last resort).
  if (realLocal.length > 0) return realLocal[0];

  // PASS 4: no real voices found — try candidate names in the full
  // local pool (might catch a real voice we missed in the allowlist).
  for (const name of candidates) {
    const exact = local.find((v) => v.name === name);
    if (exact) return exact;
    const partial = local.find((v) => v.name.includes(name));
    if (partial) return partial;
  }

  // PASS 5: nothing matched at all. Fall back to any English voice,
  // even network — better than silence (and might just work).
  return (
    available.find((v) => v.lang.startsWith("en")) ?? available[0] ?? null
  );
}

export function useSpeechSynthesis(): SpeechSynthesisHook {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const onEndRef = useRef<(() => void) | null>(null);
  // Chrome occasionally never fires onstart/onend (the synth "wedges").
  // A watchdog guarantees the conversation cycle always advances.
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);

    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    loadVoices();
    // Chrome loads voices asynchronously and emits this event when ready.
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      try {
        window.speechSynthesis.cancel();
      } catch {
        // already idle
      }
    };
  }, []);

  const speak = useCallback((text: string, voiceId: string): boolean => {
    if (typeof window === "undefined" || !window.speechSynthesis) return false;
    const trimmed = text.trim();
    if (!trimmed) return false;

    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
    if (watchdogRef.current) clearTimeout(watchdogRef.current);
    startedRef.current = false;

    const utterance = new SpeechSynthesisUtterance(trimmed);
    const picked = pickVoice(voiceId, voicesRef.current);
    if (picked) {
      utterance.voice = picked;
      utterance.lang = picked.lang;
    } else {
      utterance.lang = "en-US";
    }
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    const finish = () => {
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
      if (utteranceRef.current !== utterance) return; // superseded
      setIsSpeaking(false);
      utteranceRef.current = null;
      onEndRef.current?.();
    };

    utterance.onstart = () => {
      startedRef.current = true;
      setIsSpeaking(true);
    };
    utterance.onend = finish;
    utterance.onerror = finish;

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);

    // Watchdog: if onstart never fires within 1.2s the synth wedged
    // (a known Chrome bug) — advance the cycle so it doesn't hang in
    // "speaking" forever. ~12 chars/sec is a conservative speaking rate.
    const armWatchdog = () => {
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
      const cap = startedRef.current
        ? Math.max(4000, (trimmed.length / 12) * 1000 + 3000)
        : 1200;
      watchdogRef.current = setTimeout(() => {
        if (startedRef.current && window.speechSynthesis.speaking) {
          // Genuinely still speaking a long reply — re-arm rather than cut off.
          armWatchdog();
          return;
        }
        finish();
      }, cap);
    };
    armWatchdog();
    return true;
  }, []);

  const stop = useCallback(() => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
    utteranceRef.current = null;
    setIsSpeaking(false);
  }, []);

  const setOnEnd = useCallback((cb: (() => void) | null) => {
    onEndRef.current = cb;
  }, []);

  const unlock = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      // Speaking a near-silent utterance inside the gesture warms up the
      // engine so a later speak() (after the LLM stream) isn't blocked.
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      window.speechSynthesis.speak(u);
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }, []);

  return { isSupported, isSpeaking, speak, unlock, stop, setOnEnd };
}

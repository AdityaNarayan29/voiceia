"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface SpeechSynthesisHook {
  isSupported: boolean;
  isSpeaking: boolean;
  speak: (text: string, voiceId: string) => boolean;
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

function pickVoice(
  voiceId: string,
  available: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  if (available.length === 0) return null;
  const candidates = VOICE_CANDIDATES[voiceId] ?? VOICE_CANDIDATES.calm;
  for (const name of candidates) {
    const exact = available.find((v) => v.name === name);
    if (exact) return exact;
    const partial = available.find((v) => v.name.includes(name));
    if (partial) return partial;
  }
  // Last resort: first English voice, or first voice at all.
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

    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
      onEndRef.current?.();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
      onEndRef.current?.();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    return true;
  }, []);

  const stop = useCallback(() => {
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

  return { isSupported, isSpeaking, speak, stop, setOnEnd };
}

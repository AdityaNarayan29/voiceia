"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  SpeechRecognitionConstructor,
  SpeechRecognitionInstance,
} from "@/lib/speechTypes";

export interface SpeechRecognitionHook {
  transcript: string;
  interimTranscript: string;
  finalTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  reset: () => void;
}

function getCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) finalText += text;
        else interim += text;
      }
      if (interim) setInterimTranscript(interim);
      if (finalText) {
        setFinalTranscript((prev) => (prev ? `${prev} ${finalText}` : finalText));
        setInterimTranscript("");
      }
    };

    recognition.onerror = (event) => {
      setError(event.error || "speech recognition error");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch {
        // already stopped
      }
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.onstart = null;
      recognitionRef.current = null;
    };
  }, []);

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    setError(null);
    setInterimTranscript("");
    setFinalTranscript("");
    try {
      recognition.start();
      setIsListening(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed to start recognition");
    }
  }, []);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try {
      recognition.stop();
    } catch {
      // already stopped
    }
  }, []);

  const reset = useCallback(() => {
    setInterimTranscript("");
    setFinalTranscript("");
    setError(null);
  }, []);

  const transcript = (finalTranscript + " " + interimTranscript).trim();

  return {
    transcript,
    interimTranscript,
    finalTranscript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    reset,
  };
}

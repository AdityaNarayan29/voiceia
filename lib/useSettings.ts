"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_VOICE_ID } from "@/lib/constants";

const STORAGE_KEY = "voiceai-settings";

/**
 * Voice engine for chat playback.
 * - "system": browser speechSynthesis. Instant, free, ships with the OS.
 *             Voice quality varies (macOS Samantha-type voices).
 * - "kokoro": local Kokoro container hit directly from the browser.
 *             Higher-quality neural voices but currently ~15-22s lag
 *             on Apple Silicon CPU Docker. Native MPS is much faster.
 */
export type VoiceEngine = "system" | "kokoro";

export interface Settings {
  voiceId: string;
  micSensitivity: number;
  autoStop: boolean;
  darkMode: boolean;
  voiceEngine: VoiceEngine;
  handsFree: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  voiceId: DEFAULT_VOICE_ID,
  micSensitivity: 75,
  autoStop: true,
  darkMode: true,
  voiceEngine: "kokoro",
  handsFree: true,
};

function loadFromStorage(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const merged = { ...DEFAULT_SETTINGS, ...parsed };
    // Migration: the browser "system" speechSynthesis engine is non-functional
    // on some platforms (notably macOS Chrome, where it wedges and emits no
    // audio). Coerce any stored "system" choice to the working Kokoro engine.
    if (merged.voiceEngine === "system") merged.voiceEngine = "kokoro";
    return merged;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

let currentSettings: Settings = DEFAULT_SETTINGS;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!hydrated && typeof window !== "undefined") {
    currentSettings = loadFromStorage();
    hydrated = true;
    queueMicrotask(emit);
  }
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Settings {
  return currentSettings;
}

function getServerSnapshot(): Settings {
  return DEFAULT_SETTINGS;
}

function getHydratedSnapshot(): boolean {
  return hydrated;
}

function getHydratedServerSnapshot(): boolean {
  return false;
}

function persist(next: Settings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota or private-mode — ignore */
  }
}

function setSettings(next: Settings) {
  currentSettings = next;
  persist(next);
  emit();
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    try {
      const parsed = JSON.parse(e.newValue) as Partial<Settings>;
      currentSettings = { ...DEFAULT_SETTINGS, ...parsed };
      emit();
    } catch {
      /* ignore */
    }
  });
}

export function useSettings() {
  const settings = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const isHydrated = useSyncExternalStore(
    subscribe,
    getHydratedSnapshot,
    getHydratedServerSnapshot,
  );

  const update = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings({ ...currentSettings, [key]: value });
    },
    [],
  );

  return { settings, update, hydrated: isHydrated };
}

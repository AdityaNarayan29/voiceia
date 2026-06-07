"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Conversation } from "@/lib/types";

const STORAGE_KEY = "voiceai-history";
const MAX_CONVERSATIONS = 50;

export interface ConversationHistoryHook {
  conversations: Conversation[];
  addConversation: (c: Conversation) => void;
  /**
   * Insert or update a conversation by id. If a row with that id already
   * exists it is replaced in place (preserving its sidebar slot); otherwise
   * the row is prepended. Used to group multiple voice turns within one
   * chat session into a single sidebar entry.
   */
  upsertConversation: (c: Conversation) => void;
  getConversation: (id: string) => Conversation | undefined;
  clearHistory: () => void;
  hydrated: boolean;
}

function loadFromStorage(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c): c is Conversation =>
        typeof c === "object" &&
        c !== null &&
        typeof (c as Conversation).id === "string" &&
        Array.isArray((c as Conversation).messages),
    );
  } catch {
    return [];
  }
}

function persist(list: Conversation[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota — ignore */
  }
}

let current: Conversation[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!hydrated && typeof window !== "undefined") {
    current = loadFromStorage();
    hydrated = true;
    queueMicrotask(emit);
  }
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Conversation[] {
  return current;
}

function getServerSnapshot(): Conversation[] {
  return [];
}

function getHydratedSnapshot(): boolean {
  return hydrated;
}

function getHydratedServerSnapshot(): boolean {
  return false;
}

function setList(next: Conversation[]) {
  current = next;
  persist(next);
  emit();
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    current = loadFromStorage();
    emit();
  });
}

export function useConversationHistory(): ConversationHistoryHook {
  const conversations = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const isHydrated = useSyncExternalStore(
    subscribe,
    getHydratedSnapshot,
    getHydratedServerSnapshot,
  );

  const addConversation = useCallback((c: Conversation) => {
    setList([c, ...current].slice(0, MAX_CONVERSATIONS));
  }, []);

  const upsertConversation = useCallback((c: Conversation) => {
    const idx = current.findIndex((existing) => existing.id === c.id);
    if (idx === -1) {
      setList([c, ...current].slice(0, MAX_CONVERSATIONS));
      return;
    }
    // Replace in place — preserves sidebar position so the active session
    // doesn't reshuffle every turn. Pin its timestamp to the original
    // session start so date labels stay stable.
    const next = current.slice();
    next[idx] = { ...c, timestamp: current[idx].timestamp };
    setList(next);
  }, []);

  const getConversation = useCallback(
    (id: string) => current.find((c) => c.id === id),
    // current is module-scoped; we re-read on each call so no dep needed.
    [],
  );

  const clearHistory = useCallback(() => {
    setList([]);
  }, []);

  return {
    conversations,
    addConversation,
    upsertConversation,
    getConversation,
    clearHistory,
    hydrated: isHydrated,
  };
}

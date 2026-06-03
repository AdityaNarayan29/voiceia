"use client";

import { useCallback, useEffect, useState } from "react";
import type { Conversation } from "@/lib/types";

const STORAGE_KEY = "voiceai-history";
const MAX_CONVERSATIONS = 50;

export interface ConversationHistoryHook {
  conversations: Conversation[];
  addConversation: (c: Conversation) => void;
  clearHistory: () => void;
  hydrated: boolean;
}

function load(): Conversation[] {
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
    // quota or serialization issues — drop silently
  }
}

export function useConversationHistory(): ConversationHistoryHook {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConversations(load());
    setHydrated(true);
  }, []);

  const addConversation = useCallback((c: Conversation) => {
    setConversations((prev) => {
      const next = [c, ...prev].slice(0, MAX_CONVERSATIONS);
      persist(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setConversations([]);
    persist([]);
  }, []);

  return { conversations, addConversation, clearHistory, hydrated };
}

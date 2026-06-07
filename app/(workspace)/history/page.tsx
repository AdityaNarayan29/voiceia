"use client";

import { Clock } from "lucide-react";
import { HistoryCard } from "@/components/HistoryCard";
import { useConversationHistory } from "@/lib/useConversationHistory";
import { useGsapReveal } from "@/lib/useGsapReveal";

export default function HistoryPage() {
  const { conversations, clearHistory, hydrated } = useConversationHistory();

  const revealRef = useGsapReveal<HTMLDivElement>({
    y: 14,
    stagger: 0.05,
    duration: 0.5,
    enabled: hydrated,
    deps: [conversations.length, hydrated],
  });

  return (
    <main ref={revealRef} className="min-h-[100dvh]">
      <header
        data-reveal
        className="flex items-center justify-between px-4 pt-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        <h1 className="font-syne text-lg font-bold text-textPrimary">
          History
        </h1>
        {hydrated && conversations.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            className="min-h-[48px] font-geistMono text-xs text-textMuted transition-colors hover:text-textPrimary"
          >
            clear all
          </button>
        )}
      </header>

      <section className="flex flex-col gap-3 px-4 pb-12 pt-4">
        {hydrated && conversations.length === 0 ? (
          <div
            data-reveal
            className="flex flex-col items-center justify-center gap-2 py-20 text-textMuted"
          >
            <Clock size={32} strokeWidth={1.5} />
            <p className="font-syne text-base font-semibold text-textPrimary">
              No conversations yet
            </p>
            <p className="font-geistMono text-xs text-textMuted">
              Start talking to see history here
            </p>
          </div>
        ) : (
          conversations.map((c) => (
            <div key={c.id} data-reveal>
              <HistoryCard conversation={c} />
            </div>
          ))
        )}
      </section>
    </main>
  );
}

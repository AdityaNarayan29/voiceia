"use client";

import { memo } from "react";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { VOICES } from "@/lib/constants";
import type { Conversation } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HistoryCardProps {
  conversation: Conversation;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

function HistoryCardImpl({ conversation }: HistoryCardProps) {
  const firstUserMessage =
    conversation.messages.find((m) => m.role === "user")?.content ?? "";
  const voice = VOICES.find((v) => v.id === conversation.voice);
  const dateLabel = formatDate(conversation.timestamp);

  return (
    <Card
      role="article"
      aria-label={`Conversation on ${dateLabel}`}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 border-borderSoft bg-bgCard px-4 py-4",
        "transition-transform duration-200 ease-out active:scale-[0.98]",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="font-syne text-xs text-textMuted">{dateLabel}</span>
        <p className="truncate font-geistMono text-sm text-textPrimary">
          {firstUserMessage}
        </p>
        <span className="mt-1 inline-flex w-fit rounded-full bg-borderSoft px-2 py-0.5 font-geistMono text-[10px] text-textMuted">
          {formatDuration(conversation.duration)}
        </span>
      </div>
      <div className="flex flex-col items-end justify-between gap-2 self-stretch">
        {voice && (
          <span className="rounded-full bg-accent/10 px-2 py-0.5 font-geistMono text-[10px] text-accent">
            {voice.name}
          </span>
        )}
        <ChevronRight size={20} className="text-textMuted" aria-hidden />
      </div>
    </Card>
  );
}

export const HistoryCard = memo(HistoryCardImpl);

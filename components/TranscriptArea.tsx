"use client";

import { useEffect, useRef } from "react";
import { Mic } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TranscriptAreaProps {
  messages: Message[];
  isLoading?: boolean;
  interimText?: string;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function TranscriptArea({
  messages,
  isLoading,
  interimText,
}: TranscriptAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isLoading, interimText]);

  const hasInterim = !!interimText && interimText.trim().length > 0;
  const isEmpty = messages.length === 0 && !isLoading && !hasInterim;

  return (
    <ScrollArea
      className="w-full"
      style={{ maxHeight: "40vh" }}
      aria-label="Conversation transcript"
      aria-live="polite"
    >
      <div className="flex flex-col gap-3 px-4 py-3">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-textMuted">
            <Mic size={24} strokeWidth={1.5} />
            <p className="font-geistMono text-[13px]">
              Start speaking to begin a conversation
            </p>
          </div>
        ) : (
          <>
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex w-full flex-col gap-1",
                    isUser ? "items-end" : "items-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl border px-3 py-2 font-geistMono text-[13px] text-textPrimary",
                      isUser
                        ? "rounded-tr-sm border-accent/20 bg-accent/10"
                        : "rounded-tl-sm border-borderStrong bg-bgCard",
                    )}
                  >
                    {m.content}
                  </div>
                  <span className="font-geistMono text-[10px] text-textMuted">
                    {formatTime(m.timestamp)}
                  </span>
                </div>
              );
            })}
            {hasInterim && (
              <div className="flex w-full flex-col items-end gap-1">
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm border border-accent/10 bg-accent/5 px-3 py-2 font-geistMono text-[13px] italic text-textMuted">
                  {interimText}
                </div>
              </div>
            )}
            {isLoading && (
              <div className="flex w-full items-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-borderStrong bg-bgCard px-3 py-2.5">
                  <span
                    className="anim-typing-dot h-1.5 w-1.5 rounded-full bg-textMuted"
                    style={{ animationDelay: "0s" }}
                  />
                  <span
                    className="anim-typing-dot h-1.5 w-1.5 rounded-full bg-textMuted"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <span
                    className="anim-typing-dot h-1.5 w-1.5 rounded-full bg-textMuted"
                    style={{ animationDelay: "0.4s" }}
                  />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}

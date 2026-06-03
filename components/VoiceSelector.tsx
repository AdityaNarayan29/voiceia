"use client";

import { useCallback, useEffect, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VOICES } from "@/lib/constants";

const STORAGE_KEY = "voiceai-selected-voice";

interface VoiceSelectorProps {
  value: string;
  onChange: (id: string) => void;
}

export function VoiceSelector({ value, onChange }: VoiceSelectorProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && saved !== value && VOICES.some((v) => v.id === saved)) {
      onChange(saved);
    }
  }, [onChange, value]);

  const handleChange = useCallback(
    (id: string) => {
      onChange(id);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, id);
      }
    },
    [onChange],
  );

  const selected = useMemo(() => VOICES.find((v) => v.id === value), [value]);
  const voiceItems = useMemo(
    () =>
      VOICES.map((voice) => (
        <SelectItem
          key={voice.id}
          value={voice.id}
          className="flex flex-col items-start gap-0.5 py-2 font-geistMono text-textPrimary focus:bg-accent/10 focus:text-textPrimary"
        >
          <div className="flex w-full items-center justify-between gap-3">
            <span className="font-syne font-semibold">{voice.name}</span>
            <span className="text-[11px] text-textMuted">{voice.tone}</span>
          </div>
          <span className="text-[10px] text-textMuted">
            {voice.description}
          </span>
        </SelectItem>
      )),
    [],
  );

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger
        aria-label="Select voice"
        className="h-10 min-w-[160px] gap-2 border-borderStrong bg-bgCard font-geistMono text-sm text-textPrimary"
      >
        <SelectValue placeholder="Select voice">
          {selected && (
            <span className="flex items-center gap-2">
              <span className="font-syne font-semibold">{selected.name}</span>
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent">
                {selected.tone}
              </span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="border-borderStrong bg-bgCard">
        {voiceItems}
      </SelectContent>
    </Select>
  );
}

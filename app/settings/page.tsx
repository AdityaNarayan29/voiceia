"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Pause, Play } from "lucide-react";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { VOICES } from "@/lib/constants";
import { useSettings } from "@/lib/useSettings";
import { useAudioPlayer } from "@/lib/useAudioPlayer";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0";

const PREVIEW_TEXT =
  "Hi, I'm here to talk with you. Tap the mic and let's get started.";

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 font-syne text-xs font-semibold uppercase tracking-wider text-textMuted">
      {children}
    </h2>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[48px] items-center justify-between gap-4 py-2">
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { settings, update, hydrated } = useSettings();
  const player = useAudioPlayer();
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const stopPreview = useCallback(() => {
    player.stop();
    setPreviewingId(null);
  }, [player]);

  const playPreview = useCallback(
    async (voiceId: string) => {
      if (previewingId === voiceId) {
        stopPreview();
        return;
      }
      stopPreview();
      setLoadingId(voiceId);
      try {
        const res = await fetch("/api/speak", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: PREVIEW_TEXT, voiceId }),
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          let message = `Preview failed (${res.status})`;
          try {
            const parsed = JSON.parse(errText) as { error?: string };
            if (parsed.error) message = parsed.error;
          } catch {
            if (errText) message = errText.slice(0, 160);
          }
          toast.error(message);
          return;
        }
        const blob = await res.blob();
        setPreviewingId(voiceId);
        player.setOnEnd(() => setPreviewingId(null));
        player.playBlob(blob);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Preview failed");
      } finally {
        setLoadingId(null);
      }
    },
    [player, previewingId, stopPreview],
  );

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-[100dvh] px-4 py-6 pb-[100px]"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)" }}
    >
      <h1 className="mb-6 font-syne text-lg font-bold text-textPrimary">
        Settings
      </h1>

      <section className="mb-2">
        <SectionHeader>Voice</SectionHeader>
        <p className="mb-3 font-geistMono text-xs text-textMuted">
          Default Voice
        </p>
        <RadioGroup
          value={settings.voiceId}
          onValueChange={(v) => update("voiceId", v)}
          disabled={!hydrated}
          className="flex flex-col gap-2"
        >
          {VOICES.map((voice) => {
            const isLoading = loadingId === voice.id;
            const isPlaying = previewingId === voice.id;
            return (
              <div
                key={voice.id}
                className="flex min-h-[48px] items-center gap-3 rounded-lg border border-borderSoft bg-bgCard px-3 py-2"
              >
                <label
                  htmlFor={`voice-${voice.id}`}
                  className="flex flex-1 cursor-pointer items-center gap-3"
                >
                  <RadioGroupItem
                    id={`voice-${voice.id}`}
                    value={voice.id}
                    className="border-textMuted text-accent"
                  />
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <span className="font-syne text-sm font-semibold text-textPrimary">
                      {voice.name}
                    </span>
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 font-geistMono text-[10px] text-accent">
                      {voice.tone}
                    </span>
                  </div>
                </label>
                <button
                  type="button"
                  onClick={() => playPreview(voice.id)}
                  disabled={isLoading}
                  aria-label={
                    isPlaying
                      ? `Stop ${voice.name} preview`
                      : `Play ${voice.name} preview`
                  }
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent/30 bg-accent/5 text-accent transition-colors hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" aria-hidden />
                  ) : isPlaying ? (
                    <Pause size={16} aria-hidden />
                  ) : (
                    <Play size={16} aria-hidden />
                  )}
                </button>
              </div>
            );
          })}
        </RadioGroup>
      </section>

      <Separator className="my-6 bg-borderSoft" />

      <section className="mb-2">
        <SectionHeader>Audio</SectionHeader>
        <Row>
          <span className="font-geistMono text-sm text-textPrimary">
            Mic Sensitivity
          </span>
          <span className="font-geistMono text-xs text-textMuted">
            {settings.micSensitivity}
          </span>
        </Row>
        <Slider
          value={[settings.micSensitivity]}
          min={0}
          max={100}
          step={5}
          disabled={!hydrated}
          onValueChange={(v) => update("micSensitivity", v[0] ?? 0)}
          className="my-2"
        />
        <Row>
          <span className="font-geistMono text-sm text-textPrimary">
            Auto-stop listening
          </span>
          <Switch
            checked={settings.autoStop}
            onCheckedChange={(v) => update("autoStop", v)}
            disabled={!hydrated}
          />
        </Row>
      </section>

      <Separator className="my-6 bg-borderSoft" />

      <section className="mb-2">
        <SectionHeader>Appearance</SectionHeader>
        <Row>
          <span className="font-geistMono text-sm text-textPrimary">
            Dark Mode
          </span>
          <ThemeToggle
            value={settings.darkMode}
            onChange={(v) => update("darkMode", v)}
            disabled={!hydrated}
          />
        </Row>
        <p className="font-geistMono text-[11px] text-textMuted">
          {settings.darkMode
            ? "Switch off for a light interface."
            : "Switch on for the dark futurist look."}
        </p>
      </section>

      <Separator className="my-6 bg-borderSoft" />

      <section>
        <SectionHeader>About</SectionHeader>
        <Row>
          <span className="font-geistMono text-sm text-textPrimary">
            Version
          </span>
          <span className="font-geistMono text-xs text-textMuted">
            {APP_VERSION}
          </span>
        </Row>
        <Row>
          <span className="font-geistMono text-sm text-textPrimary">
            Built with
          </span>
          <span className="font-geistMono text-xs text-textMuted">
            Next.js + Groq + Kokoro
          </span>
        </Row>
      </section>

      <BottomNav />
    </motion.main>
  );
}

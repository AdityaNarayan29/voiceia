"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Info,
  Loader2,
  Mic,
  MicOff,
  Palette,
  Pause,
  Play,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MicLevelMeter } from "@/components/MicLevelMeter";
import { VOICES } from "@/lib/constants";
import { useSettings } from "@/lib/useSettings";
import { useAudioRecorder } from "@/lib/useAudioRecorder";
import { useStreamingAudioPlayer } from "@/lib/useStreamingAudioPlayer";
import { useGsapReveal } from "@/lib/useGsapReveal";
import { isKokoroConfigured, kokoroSpeak } from "@/lib/kokoroClient";
import { cn } from "@/lib/utils";

const MIC_TEST_MAX_MS = 30_000;
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0";
const PREVIEW_TEXT =
  "Hi, I'm here to talk with you. Tap the mic and let's get started.";

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section
      data-reveal
      className="overflow-hidden rounded-2xl border border-borderSoft bg-bgCard shadow-[0_1px_0_var(--border-soft)] transition-shadow hover:shadow-[0_0_24px_var(--accent-glow)]"
    >
      <header className="flex items-center gap-2 border-b border-borderSoft bg-bgSecondary/40 px-4 py-3">
        <span
          aria-hidden
          className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent/10 text-accent"
        >
          <Icon size={14} aria-hidden />
        </span>
        <h2 className="font-syne text-[11px] font-semibold uppercase tracking-[0.18em] text-textMuted">
          {title}
        </h2>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function ControlRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[48px] items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="font-geistMono text-sm text-textPrimary">{label}</p>
        {hint && (
          <p className="mt-0.5 font-geistMono text-[11px] text-textMuted">
            {hint}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, update, hydrated } = useSettings();
  const streamingPlayer = useStreamingAudioPlayer();
  const recorder = useAudioRecorder();
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [testingMic, setTestingMic] = useState(false);
  const testTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startMicTest = useCallback(
    async (sensitivity: number) => {
      await recorder.startRecording({
        sensitivity,
        autoStop: false,
      });
      if (recorder.error) {
        toast.error(recorder.error);
        setTestingMic(false);
        return;
      }
    },
    [recorder],
  );

  const stopMicTest = useCallback(async () => {
    if (testTimerRef.current) {
      clearTimeout(testTimerRef.current);
      testTimerRef.current = null;
    }
    await recorder.stopRecording();
    setTestingMic(false);
  }, [recorder]);

  const toggleMicTest = useCallback(async () => {
    if (testingMic) {
      await stopMicTest();
      return;
    }
    setTestingMic(true);
    await startMicTest(settings.micSensitivity);
    testTimerRef.current = setTimeout(() => {
      void stopMicTest();
      toast.info("Mic test stopped after 30s.");
    }, MIC_TEST_MAX_MS);
  }, [testingMic, startMicTest, stopMicTest, settings.micSensitivity]);

  useEffect(() => {
    if (!testingMic) return;
    let cancelled = false;
    void (async () => {
      await recorder.stopRecording();
      if (cancelled) return;
      await startMicTest(settings.micSensitivity);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.micSensitivity]);

  useEffect(() => {
    return () => {
      if (testTimerRef.current) clearTimeout(testTimerRef.current);
    };
  }, []);

  const stopPreview = useCallback(() => {
    streamingPlayer.stop();
    setPreviewingId(null);
  }, [streamingPlayer]);

  const playPreview = useCallback(
    async (voiceId: string) => {
      if (previewingId === voiceId) {
        stopPreview();
        return;
      }
      stopPreview();

      if (!isKokoroConfigured()) {
        toast.error(
          "Set NEXT_PUBLIC_KOKORO_URL in .env.local to enable voice previews.",
        );
        return;
      }

      setLoadingId(voiceId);
      try {
        const res = await kokoroSpeak({ text: PREVIEW_TEXT, voiceId });
        setPreviewingId(voiceId);
        streamingPlayer.setOnEnd(() => setPreviewingId(null));
        await streamingPlayer.playStream(res, "audio/mpeg");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Preview failed");
        setPreviewingId(null);
      } finally {
        setLoadingId(null);
      }
    },
    [previewingId, stopPreview, streamingPlayer],
  );

  const revealRef = useGsapReveal<HTMLDivElement>({
    y: 16,
    stagger: 0.07,
    duration: 0.55,
  });

  return (
    <main
      ref={revealRef}
      className="min-h-[100dvh] pb-12"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)" }}
    >
      <div className="mx-auto w-full max-w-md px-4 sm:max-w-xl lg:max-w-2xl lg:px-6">
        <header data-reveal className="mb-6">
          <h1 className="font-syne text-2xl font-bold text-textPrimary sm:text-3xl">
            Settings
          </h1>
          <p className="mt-1 font-geistMono text-xs text-textMuted sm:text-sm">
            Personalize how VoiceAI sounds and behaves.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:gap-5">
          <SectionCard title="Voice" icon={Volume2}>
            <p className="mb-3 font-geistMono text-[11px] text-textMuted">
              Choose the voice for chat replies and previews.
            </p>
            <div
              role="radiogroup"
              aria-label="Default voice"
              className="grid grid-cols-2 gap-2 sm:grid-cols-3"
            >
              {VOICES.map((voice) => {
                const selected = settings.voiceId === voice.id;
                const isLoading = loadingId === voice.id;
                const isPlaying = previewingId === voice.id;
                return (
                  <div
                    key={voice.id}
                    className={cn(
                      "relative flex flex-col gap-2 rounded-xl border p-3 transition-all duration-200",
                      selected
                        ? "border-accent/60 bg-accent/5 shadow-[0_0_18px_var(--accent-glow)]"
                        : "border-borderSoft bg-bgSecondary/40 hover:-translate-y-0.5 hover:border-borderStrong",
                    )}
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={`Select ${voice.name}, ${voice.tone}`}
                      disabled={!hydrated}
                      onClick={() => update("voiceId", voice.id)}
                      className="flex flex-1 flex-col items-start gap-1 text-left focus-visible:outline-none"
                    >
                      <span className="flex w-full items-start justify-between gap-1">
                        <span className="font-syne text-sm font-semibold text-textPrimary">
                          {voice.name}
                        </span>
                        {selected && (
                          <span
                            aria-hidden
                            className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent text-bgPrimary"
                          >
                            <Check size={10} strokeWidth={3} aria-hidden />
                          </span>
                        )}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 font-geistMono text-[10px]",
                          selected
                            ? "bg-accent/15 text-accent"
                            : "bg-borderSoft text-textMuted",
                        )}
                      >
                        {voice.tone}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => playPreview(voice.id)}
                      disabled={isLoading}
                      aria-label={
                        isPlaying
                          ? `Stop ${voice.name} preview`
                          : `Play ${voice.name} preview`
                      }
                      className={cn(
                        "inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md border font-geistMono text-[11px] transition-all duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bgCard",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "active:scale-95",
                        isPlaying
                          ? "border-accent/60 bg-accent text-bgPrimary"
                          : "border-borderSoft bg-bgPrimary/40 text-textPrimary hover:border-accent/40 hover:text-accent",
                      )}
                    >
                      {isLoading ? (
                        <>
                          <Loader2
                            size={12}
                            className="animate-spin"
                            aria-hidden
                          />
                          Loading
                        </>
                      ) : isPlaying ? (
                        <>
                          <Pause size={12} aria-hidden />
                          Playing
                        </>
                      ) : (
                        <>
                          <Play size={12} aria-hidden />
                          Preview
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Audio" icon={Mic}>
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <p className="font-geistMono text-sm text-textPrimary">
                    Voice engine
                  </p>
                  <span className="font-geistMono text-[10px] uppercase tracking-wider text-textMuted">
                    {settings.voiceEngine === "system"
                      ? "Fast"
                      : "High quality"}
                  </span>
                </div>
                <div
                  role="radiogroup"
                  aria-label="Voice engine"
                  className="grid grid-cols-2 gap-1 rounded-lg border border-borderSoft bg-bgSecondary/40 p-1"
                >
                  {[
                    {
                      id: "system" as const,
                      label: "System voice",
                      sub: "Instant · OS voices",
                    },
                    {
                      id: "kokoro" as const,
                      label: "Kokoro",
                      sub: "Higher quality · slower",
                    },
                  ].map((opt) => {
                    const active = settings.voiceEngine === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={!hydrated}
                        onClick={() => update("voiceEngine", opt.id)}
                        className={cn(
                          "flex flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left transition-all duration-200",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                          active
                            ? "bg-accent/10 text-accent shadow-[inset_0_0_0_1px_var(--accent)]"
                            : "text-textPrimary hover:bg-bgCard",
                        )}
                      >
                        <span className="font-syne text-xs font-semibold">
                          {opt.label}
                        </span>
                        <span
                          className={cn(
                            "font-geistMono text-[10px]",
                            active ? "text-accent/80" : "text-textMuted",
                          )}
                        >
                          {opt.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 font-geistMono text-[11px] text-textMuted">
                  {settings.voiceEngine === "system"
                    ? "Uses your OS voice (Samantha, Daniel, etc.). Plays instantly. If it ever goes silent, fully quit and reopen your browser to reset it."
                    : "Uses local Kokoro. Voice matches the previews above. Audio takes ~10–20s to start on CPU."}
                </p>
              </div>

              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <p className="font-geistMono text-sm text-textPrimary">
                    Mic Sensitivity
                  </p>
                  <span className="font-geistMono text-xs tabular-nums text-textMuted">
                    {settings.micSensitivity}
                  </span>
                </div>
                <Slider
                  value={[settings.micSensitivity]}
                  min={0}
                  max={100}
                  step={5}
                  disabled={!hydrated}
                  onValueChange={(v) => update("micSensitivity", v[0] ?? 0)}
                  className="mb-3"
                />

                <div className="flex items-center gap-3 rounded-lg border border-borderSoft bg-bgSecondary/40 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => void toggleMicTest()}
                    disabled={!hydrated}
                    aria-label={testingMic ? "Stop mic test" : "Start mic test"}
                    aria-pressed={testingMic}
                    className={cn(
                      "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bgCard",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      "active:scale-90",
                      testingMic
                        ? "border-error/40 bg-error/10 text-error hover:bg-error/20"
                        : "border-accent/30 bg-accent/5 text-accent hover:bg-accent/15",
                    )}
                  >
                    {testingMic ? (
                      <MicOff size={14} aria-hidden />
                    ) : (
                      <Mic size={14} aria-hidden />
                    )}
                  </button>
                  <MicLevelMeter
                    level={recorder.level}
                    inactive={!testingMic}
                    className="flex-1"
                  />
                  <span className="w-8 text-right font-geistMono text-[10px] tabular-nums text-textMuted">
                    {testingMic ? Math.round(recorder.level * 100) : "—"}
                  </span>
                </div>
                <p className="mt-2 font-geistMono text-[11px] text-textMuted">
                  {testingMic
                    ? "Speak normally. Adjust the slider while green bars light up."
                    : "Tap to test. Aim for green bars when talking at normal volume."}
                </p>
              </div>

              <div className="border-t border-borderSoft pt-3">
                <ControlRow
                  label="Auto-stop listening"
                  hint="Stop recording after ~1.5s of silence"
                >
                  <Switch
                    checked={settings.autoStop}
                    onCheckedChange={(v) => update("autoStop", v)}
                    disabled={!hydrated}
                  />
                </ControlRow>
              </div>

              <div className="border-t border-borderSoft pt-3">
                <ControlRow
                  label="Hands-free mode"
                  hint="Auto-start listening after the AI finishes speaking"
                >
                  <Switch
                    checked={settings.handsFree}
                    onCheckedChange={(v) => update("handsFree", v)}
                    disabled={!hydrated}
                  />
                </ControlRow>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Appearance" icon={Palette}>
            <ControlRow
              label="Dark Mode"
              hint={
                settings.darkMode
                  ? "Switch off for a light interface."
                  : "Switch on for the dark futurist look."
              }
            >
              <ThemeToggle
                value={settings.darkMode}
                onChange={(v) => update("darkMode", v)}
                disabled={!hydrated}
              />
            </ControlRow>
          </SectionCard>

          <SectionCard title="About" icon={Info}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 font-geistMono text-xs">
              <dt className="text-textMuted">Version</dt>
              <dd className="text-right text-textPrimary tabular-nums">
                {APP_VERSION}
              </dd>
              <dt className="text-textMuted">Built with</dt>
              <dd className="text-right text-textPrimary">
                Next.js · Groq · Kokoro
              </dd>
              <dt className="text-textMuted">Source</dt>
              <dd className="text-right">
                <a
                  href="https://github.com/AdityaNarayan29/voiceia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent transition-colors hover:underline"
                >
                  github.com/voiceia
                </a>
              </dd>
            </dl>
          </SectionCard>
        </div>
      </div>
    </main>
  );
}

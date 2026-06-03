"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Mic,
  Zap,
  ShieldCheck,
  Sparkles,
  Wifi,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeroOrb, type OrbState } from "@/components/HeroOrb";
import { VOICES } from "@/lib/constants";

type DemoMessage = {
  role: "user" | "assistant";
  content: string;
};

const DEMO_SCRIPT: DemoMessage[] = [
  { role: "user", content: "What's the weather like for a run today?" },
  {
    role: "assistant",
    content:
      "Sixty-two and clear in your area — light breeze from the west. Great window between four and six.",
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Sub-second latency",
    body: "Streaming chat + audio. Words start coming back before you finish speaking.",
  },
  {
    icon: ShieldCheck,
    title: "On-device first",
    body: "Mic capture, voice activity detection, and history all stay in your browser.",
  },
  {
    icon: Sparkles,
    title: "Five distinct voices",
    body: "Pick a tone that fits the conversation — calm, energetic, warm, confident, smooth.",
  },
  {
    icon: Wifi,
    title: "Works offline",
    body: "Install as a PWA. The shell loads even without a connection; voice resumes when you're back.",
  },
];

function useScriptedDemo(onStateChange: (s: OrbState) => void) {
  const [phase, setPhase] = useState<"idle" | "user" | "assistant">("idle");
  const [partial, setPartial] = useState("");
  const [level, setLevel] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rafRef = useRef<number | null>(null);

  const reset = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setPartial("");
    setLevel(0);
    setPhase("idle");
    onStateChange("idle");
  }, [onStateChange]);

  const run = useCallback(() => {
    reset();

    const user = DEMO_SCRIPT[0].content;
    const assistant = DEMO_SCRIPT[1].content;
    const userWords = user.split(" ");
    const assistantWords = assistant.split(" ");

    setPhase("user");
    onStateChange("listening");

    const start = performance.now();
    const animateLevel = () => {
      const t = (performance.now() - start) / 1000;
      const v =
        Math.abs(Math.sin(t * 6)) * 0.55 +
        Math.abs(Math.sin(t * 11)) * 0.35;
      setLevel(Math.min(1, v));
      rafRef.current = requestAnimationFrame(animateLevel);
    };
    rafRef.current = requestAnimationFrame(animateLevel);

    userWords.forEach((_, i) => {
      timers.current.push(
        setTimeout(
          () => setPartial(userWords.slice(0, i + 1).join(" ")),
          120 * (i + 1),
        ),
      );
    });

    const userDoneAt = 120 * userWords.length + 400;
    timers.current.push(
      setTimeout(() => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        setLevel(0);
        setPhase("assistant");
        onStateChange("speaking");
        setPartial("");
      }, userDoneAt),
    );

    assistantWords.forEach((_, i) => {
      timers.current.push(
        setTimeout(
          () => setPartial(assistantWords.slice(0, i + 1).join(" ")),
          userDoneAt + 90 * (i + 1),
        ),
      );
    });

    timers.current.push(
      setTimeout(
        () => {
          setPhase("idle");
          onStateChange("idle");
        },
        userDoneAt + 90 * assistantWords.length + 1400,
      ),
    );
  }, [reset, onStateChange]);

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { phase, partial, level, run, reset };
}

export default function LandingPage() {
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const demo = useScriptedDemo(setOrbState);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative min-h-[100dvh] overflow-x-hidden bg-bgPrimary"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid-bg opacity-70"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/3 rounded-full"
        style={{
          background:
            "radial-gradient(circle, var(--accent-glow) 0%, transparent 60%)",
        }}
      />

      <header
        className="relative z-10 flex items-center justify-between px-6 py-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_var(--accent-glow)]"
          />
          <span className="font-syne text-base font-bold tracking-wide">
            VoiceAI
          </span>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="min-h-[48px] text-textMuted hover:bg-transparent hover:text-textPrimary"
        >
          <Link href="/app">Open app</Link>
        </Button>
      </header>

      <section className="relative z-10 mx-auto flex max-w-md flex-col items-center px-6 pb-12 pt-6 text-center">
        <Badge
          variant="outline"
          className="mb-6 gap-1.5 border-accent/30 bg-accent/5 font-geistMono text-[10px] uppercase tracking-widest text-accent"
        >
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)]"
          />
          Voice-native AI
        </Badge>

        <h1 className="font-syne text-[40px] font-bold leading-[1.05] tracking-tight text-textPrimary sm:text-5xl">
          Talk to AI.
          <br />
          <span className="text-accent">It talks back.</span>
        </h1>

        <p className="mt-5 max-w-[20rem] font-geistMono text-sm leading-relaxed text-textMuted">
          A voice-first assistant that listens, thinks, and replies in
          real time. No typing. No screens full of chat.
        </p>

        <div className="relative mt-10">
          <HeroOrb state={orbState} level={demo.level} />
        </div>

        <div className="mt-2 flex min-h-[80px] w-full flex-col items-center justify-center gap-2 px-2">
          {demo.phase !== "idle" && (
            <>
              <span className="font-geistMono text-[10px] uppercase tracking-widest text-textMuted">
                {demo.phase === "user" ? "You" : "VoiceAI"}
              </span>
              <p
                className={
                  demo.phase === "user"
                    ? "font-geistMono text-sm text-textPrimary"
                    : "font-syne text-sm text-accent"
                }
              >
                {demo.partial}
              </p>
            </>
          )}
        </div>

        <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="min-h-[56px] flex-1 rounded-full bg-accent text-bgPrimary shadow-[0_0_40px_var(--accent-glow)] hover:bg-accent/90 sm:flex-none sm:px-10"
          >
            <Link href="/app">
              <Mic className="!h-4 !w-4" aria-hidden />
              Start talking
              <ArrowRight className="!h-4 !w-4" aria-hidden />
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => (demo.phase === "idle" ? demo.run() : demo.reset())}
            className="min-h-[56px] flex-1 rounded-full border-accent/25 bg-transparent text-textPrimary hover:bg-accent/5 hover:text-textPrimary sm:flex-none sm:px-10"
          >
            {demo.phase === "idle" ? "Play demo" : "Stop demo"}
          </Button>
        </div>

        <div className="mt-6 flex items-center gap-4 font-geistMono text-[10px] uppercase tracking-widest text-textMuted">
          <span className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-success" />
            Streaming
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-success" />
            Free tier
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-success" />
            Installable
          </span>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-md px-6 pb-16">
        <h2 className="mb-4 font-geistMono text-[10px] uppercase tracking-widest text-textMuted">
          What&apos;s inside
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <Card
              key={title}
              className="border-borderSoft bg-bgCard p-4 text-left"
            >
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md border border-accent/20 bg-accent/5 text-accent">
                <Icon size={16} aria-hidden />
              </div>
              <h3 className="mb-1 font-syne text-sm font-semibold text-textPrimary">
                {title}
              </h3>
              <p className="font-geistMono text-xs leading-relaxed text-textMuted">
                {body}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-md px-6 pb-16">
        <h2 className="mb-4 font-geistMono text-[10px] uppercase tracking-widest text-textMuted">
          Voices
        </h2>
        <div className="flex flex-wrap gap-2">
          {VOICES.map((v) => (
            <span
              key={v.id}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-borderSoft bg-bgCard px-4 font-geistMono text-xs text-textPrimary"
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)]"
              />
              <span className="font-syne text-sm font-semibold">{v.name}</span>
              <span className="text-textMuted">— {v.tone.toLowerCase()}</span>
            </span>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-md px-6 pb-16">
        <h2 className="mb-4 font-geistMono text-[10px] uppercase tracking-widest text-textMuted">
          How it works
        </h2>
        <ol className="space-y-3">
          {[
            "Tap the mic. Speak naturally.",
            "Voice activity detection knows when you're done.",
            "The model streams a reply back, spoken in your chosen voice.",
            "Every turn is saved locally — no account, no cloud sync.",
          ].map((step, i) => (
            <li
              key={step}
              className="flex items-start gap-3 rounded-lg border border-borderSoft bg-bgCard px-4 py-3"
            >
              <span className="font-geistMono text-xs text-accent">
                0{i + 1}
              </span>
              <span className="font-geistMono text-xs leading-relaxed text-textPrimary">
                {step}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="relative z-10 mx-auto max-w-md px-6 pb-24">
        <Card className="overflow-hidden border-accent/20 bg-bgCard p-6 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent"
          />
          <Download
            size={20}
            className="mx-auto mb-3 text-accent"
            aria-hidden
          />
          <h3 className="font-syne text-base font-semibold text-textPrimary">
            Install it. Use it everywhere.
          </h3>
          <p className="mx-auto mt-2 max-w-[18rem] font-geistMono text-xs leading-relaxed text-textMuted">
            Add VoiceAI to your homescreen for a full-screen, app-like
            experience.
          </p>
          <Button
            asChild
            className="mt-5 min-h-[48px] rounded-full bg-accent text-bgPrimary hover:bg-accent/90"
          >
            <Link href="/app">
              Open app
              <ArrowRight className="!h-4 !w-4" aria-hidden />
            </Link>
          </Button>
        </Card>
      </section>

      <footer
        className="relative z-10 border-t border-borderSoft px-6 py-6 text-center"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
      >
        <p className="font-geistMono text-[10px] uppercase tracking-widest text-textMuted">
          Built with Next.js · Groq · Kokoro
        </p>
      </footer>
    </motion.main>
  );
}

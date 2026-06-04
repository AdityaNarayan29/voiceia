"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
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
import GlassSurface from "@/components/ui/glass-surface";
import { HeroOrb, type OrbState } from "@/components/HeroOrb";
import { VOICES } from "@/lib/constants";

/**
 * Ferrofluid is a WebGL component — dynamic import + ssr:false so
 * it doesn't try to construct a Renderer during server render.
 * Adds ~83 KB to client bundle (ogl + the component itself).
 */
const Ferrofluid = dynamic(() => import("@/components/ui/ferrofluid"), {
  ssr: false,
});

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
        Math.abs(Math.sin(t * 6)) * 0.55 + Math.abs(Math.sin(t * 11)) * 0.35;
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
      {/*
        Ferrofluid background.
        Fixed to the viewport (position: fixed) so it stays put when the
        page scrolls — the marketing content slides over it rather than
        the bg moving away. Sits at z-0; all hero/feature content is
        z-10. Auto-paused when the user has prefers-reduced-motion.
      */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 motion-reduce:hidden"
      >
        <Ferrofluid
          // Component defaults from react-bits: white ferrofluid on dark
          // bg, cursor magnet on, speed 0.5, scale 1.6, turbulence 1,
          // fluidity 0.1, rim 0.2, sharpness 2.5, shimmer 1.5, glow 2.
          // All props omitted so the component's defaults apply.
        />
      </div>
      {/*
        Reduced-motion fallback: when motion is off, restore the static
        accent bloom so the hero doesn't look stripped.
      */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 hidden motion-reduce:block"
      >
        <div
          className="absolute left-1/2 top-0 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/3 rounded-full sm:h-[700px] sm:w-[700px]"
          style={{
            background:
              "radial-gradient(circle, var(--accent-glow) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Top nav */}
      <header
        className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 lg:px-10"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-md py-1 transition-opacity hover:opacity-80"
        >
          <span
            aria-hidden
            className="h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_var(--accent-glow)]"
          />
          <span className="font-syne text-base font-bold tracking-wide">
            VoiceAI
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden min-h-[44px] text-textMuted hover:bg-transparent hover:text-textPrimary sm:inline-flex"
          >
            <a href="#features">Features</a>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden min-h-[44px] text-textMuted hover:bg-transparent hover:text-textPrimary sm:inline-flex"
          >
            <a href="#voices">Voices</a>
          </Button>
          <Button
            asChild
            size="sm"
            className="min-h-[44px] rounded-full bg-accent px-4 text-bgPrimary shadow-[0_0_24px_var(--accent-glow)] hover:bg-accent/90"
          >
            <Link href="/app">
              Open app
              <ArrowRight className="!h-4 !w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-16 pt-8 text-center sm:pt-12 lg:px-10 lg:pb-24 lg:pt-16">
        <GlassSurface
          width="auto"
          height={36}
          borderRadius={999}
          backgroundOpacity={0.12}
          saturation={1.1}
          className="mb-6 px-4"
        >
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-geistMono text-[10px] uppercase tracking-widest text-accent">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)]"
            />
            Voice-native AI · streaming · free
          </span>
        </GlassSurface>

        <h1 className="max-w-3xl font-syne text-[44px] font-bold leading-[1.04] tracking-tight text-textPrimary sm:text-6xl lg:text-7xl">
          Talk to AI.
          <br />
          <span className="text-accent">It talks back.</span>
        </h1>

        <p className="mt-6 max-w-xl font-geistMono text-sm leading-relaxed text-textMuted sm:text-base">
          A voice-first assistant that listens, thinks, and replies in real
          time. No typing. No screens full of chat. Just conversation.
        </p>

        {/* Orb — same WebGL Orb as the in-app mic, sized up */}
        <div className="relative mt-12 sm:mt-14">
          <div className="hidden lg:block">
            <HeroOrb state={orbState} level={demo.level} size={520} />
          </div>
          <div className="hidden sm:block lg:hidden">
            <HeroOrb state={orbState} level={demo.level} size={420} />
          </div>
          <div className="sm:hidden">
            <HeroOrb state={orbState} level={demo.level} size={320} />
          </div>
        </div>

        {/* Live demo caption */}
        <div className="mt-4 flex min-h-[88px] w-full max-w-xl flex-col items-center justify-center gap-2 px-2">
          {demo.phase !== "idle" ? (
            <>
              <span className="font-geistMono text-[10px] uppercase tracking-widest text-textMuted">
                {demo.phase === "user" ? "You" : "VoiceAI"}
              </span>
              <p
                className={
                  demo.phase === "user"
                    ? "font-geistMono text-sm text-textPrimary sm:text-base"
                    : "font-syne text-sm text-accent sm:text-base"
                }
              >
                {demo.partial}
              </p>
            </>
          ) : (
            <p className="font-geistMono text-[11px] uppercase tracking-widest text-textMuted">
              Tap play demo · or open the app
            </p>
          )}
        </div>

        {/* CTAs */}
        <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
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

        {/* Status chips */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 font-geistMono text-[10px] uppercase tracking-widest text-textMuted">
          <span className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-success" />
            Streaming Groq llama-3.3
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-success" />
            100% free stack
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-success" />
            Installable PWA
          </span>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20 lg:px-10 lg:pb-28"
      >
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="mb-2 font-geistMono text-[10px] uppercase tracking-widest text-textMuted">
              What&apos;s inside
            </h2>
            <p className="max-w-2xl font-syne text-2xl font-bold leading-tight tracking-tight text-textPrimary sm:text-3xl">
              Built around how voice actually feels.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <Card
              key={title}
              className="group relative overflow-hidden border-borderSoft bg-bgCard p-5 text-left transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-[0_0_30px_var(--accent-glow)]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 transition-opacity group-hover:opacity-60"
                style={{
                  background:
                    "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
                }}
              />
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md border border-accent/20 bg-accent/5 text-accent">
                <Icon size={18} aria-hidden />
              </div>
              <h3 className="mb-1.5 font-syne text-base font-semibold text-textPrimary">
                {title}
              </h3>
              <p className="font-geistMono text-xs leading-relaxed text-textMuted">
                {body}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Voices */}
      <section
        id="voices"
        className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20 lg:px-10 lg:pb-28"
      >
        <div className="mb-8">
          <h2 className="mb-2 font-geistMono text-[10px] uppercase tracking-widest text-textMuted">
            Voices
          </h2>
          <p className="max-w-2xl font-syne text-2xl font-bold leading-tight tracking-tight text-textPrimary sm:text-3xl">
            Five tones. One you&apos;ll keep coming back to.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {VOICES.map((v) => (
            <span
              key={v.id}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-borderSoft bg-bgCard px-4 font-geistMono text-xs text-textPrimary transition-colors hover:border-accent/30"
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

      {/* How it works */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20 lg:px-10 lg:pb-28">
        <div className="mb-8">
          <h2 className="mb-2 font-geistMono text-[10px] uppercase tracking-widest text-textMuted">
            How it works
          </h2>
          <p className="max-w-2xl font-syne text-2xl font-bold leading-tight tracking-tight text-textPrimary sm:text-3xl">
            One tap. End-to-end voice loop.
          </p>
        </div>
        <ol className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {[
            "Tap the mic. Speak naturally.",
            "Voice activity detection knows when you're done.",
            "The model streams a reply back, spoken in your chosen voice.",
            "Every turn is saved locally — no account, no cloud sync.",
          ].map((step, i) => (
            <li
              key={step}
              className="relative flex items-start gap-3 rounded-lg border border-borderSoft bg-bgCard px-4 py-4"
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

      {/* Install CTA */}
      <section className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-24 lg:px-10">
        <Card className="relative overflow-hidden border-accent/25 bg-bgCard p-8 text-center sm:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, var(--accent-glow) 0%, transparent 65%)",
            }}
          />
          <Download
            size={22}
            className="mx-auto mb-3 text-accent"
            aria-hidden
          />
          <h3 className="font-syne text-2xl font-bold text-textPrimary sm:text-3xl">
            Install it. Use it everywhere.
          </h3>
          <p className="mx-auto mt-3 max-w-xl font-geistMono text-xs leading-relaxed text-textMuted sm:text-sm">
            Add VoiceAI to your homescreen for a full-screen, app-like
            experience. Works on iOS, Android, and desktop.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-6 min-h-[52px] rounded-full bg-accent px-8 text-bgPrimary shadow-[0_0_32px_var(--accent-glow)] hover:bg-accent/90"
          >
            <Link href="/app">
              Open app
              <ArrowRight className="!h-4 !w-4" aria-hidden />
            </Link>
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer
        className="relative z-10 border-t border-borderSoft px-6 py-8 text-center"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 2rem)" }}
      >
        <p className="font-geistMono text-[10px] uppercase tracking-widest text-textMuted">
          Built with Next.js · Groq · Kokoro
        </p>
      </footer>
    </motion.main>
  );
}

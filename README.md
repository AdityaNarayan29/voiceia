# VoiceAI

## What it is

A mobile-first Voice AI PWA. Tap the mic, speak, and a streaming LLM
responds in a voice you choose — all running through a clean dark UI you
can install to your homescreen.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript (strict), Tailwind CSS, shadcn/ui, framer-motion
- **PWA**: next-pwa (service worker + offline fallback + installable manifest)
- **STT**: Web Speech API (Chrome) with Groq Whisper (`whisper-large-v3`) fallback for Safari/Firefox — free
- **LLM**: Groq `llama-3.3-70b-versatile`, streamed via Server-Sent Events translated to plain text — free
- **TTS**: Browser `speechSynthesis` for chat responses (instant, free). Kokoro local TTS for Settings voice previews (free)
- **Storage**: localStorage for conversation history and settings (no backend required)

## Setup

### Prerequisites

- Node 20+
- A Groq API key (free at [console.groq.com](https://console.groq.com)) — used for chat and Whisper STT fallback
- Optional: Kokoro TTS running locally on port 8880, only used for Settings voice previews. Chat audio uses the browser's built-in `speechSynthesis` and needs no setup.

### Install

```bash
git clone <repo-url>
cd voiceai
npm install
```

### Environment

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```
GROQ_API_KEY=gsk_...                        # required (chat + STT fallback)
KOKORO_API_URL=http://localhost:8880        # optional (Settings voice previews only)
NEXT_PUBLIC_APP_VERSION=0.1.0
```

What each route uses:
- **`/api/chat`** → Groq llama-3.3-70b
- **`/api/transcribe`** → Groq whisper-large-v3 (only hit on Safari/Firefox; Chrome uses Web Speech in-browser)
- **`/api/speak`** → Kokoro (Settings voice previews only — the main chat loop uses browser `speechSynthesis` directly)

100% free stack. Nothing paid.

### Optional: Kokoro local TTS

Settings → Voice has a play button next to each of the 5 voices to preview
how they sound. Those previews call `/api/speak` → Kokoro. If you don't run
Kokoro, the preview buttons return an error toast. Everything else still
works since chat audio goes through the browser's `speechSynthesis`.

To enable previews, run a Kokoro container that exposes the OpenAI-compatible
`/v1/audio/speech` endpoint (e.g. `kokoro-fastapi`) on port 8880:

```bash
docker run -d --name kokoro-voiceai -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-cpu:v0.2.4
```

Note: Kokoro on CPU is slow for long text (~10s per 100 chars). That's fine
for short preview sentences but the reason chat audio uses the browser's
local `speechSynthesis` instead.

### Run

```bash
npm run dev     # http://localhost:3000
```

For production:

```bash
npm run build
npm run start
```

To test from a phone on the same Wi-Fi, find your local IP
(`ipconfig getifaddr en0` on macOS) and visit `http://<ip>:3000` on the phone.

### Regenerate PWA icons

```bash
node scripts/generate-icons.mjs
```

Writes `public/icons/icon-192.png` and `icon-512.png`. Edit the SVG
template in `scripts/generate-icons.mjs` to change the icon design.

## Architecture

```
Browser                          Next.js routes                External
─────────────────────────────────────────────────────────────────────────
[mic] ──getUserMedia──▶ useAudioRecorder
                        useSpeechRecognition ◀──── Web Speech API ◀── OS
                              │
                              ▼
                        useVoiceState (state machine)
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   /api/transcribe       /api/chat              /api/speak
   (Groq → OpenAI       (Groq llama-3.3 →      (Kokoro → OpenAI TTS)
    Whisper)             OpenAI gpt-4o-mini)
        │                     │                     │
        ▼                     ▼                     ▼
   transcript text     plain-text deltas       audio/mpeg bytes
                              │
                              ▼
                        useAudioPlayer (HTMLAudioElement)
                              │
                              ▼
                  onConversationComplete → useConversationHistory → localStorage
```

The voice state machine (`idle → listening → processing → speaking → idle`)
is reactive: each transition is dispatched by a hook reading the previous
step's completion (transcript settled, stream closed, audio ended).
No fixed timers in the production path.

## Phases completed

1. **Bootstrap** — Next 14 + Tailwind + shadcn (slate), fonts (Syne + Geist Mono), PWA manifest, env wiring.
2. **Types + state machine** — `VoiceState` reducer, mock voice loop, `Conversation` types.
3. **Components** — MicButton, Waveform, StatusPill, TranscriptArea, VoiceSelector, BottomNav, HistoryCard.
4. **Pages + navigation** — Home, History, Settings with framer-motion entry transitions.
5. **Real STT** — MediaRecorder + Groq Whisper route (OpenAI Whisper fallback). Web Speech API hook is kept but disabled — cross-browser support was too uneven.
6. **Full loop** — Groq `llama-3.3-70b-versatile` streaming chat (OpenAI `gpt-4o-mini` fallback), Kokoro/OpenAI TTS routes, audio player, persistent history.
8. **Settings wired** — mic sensitivity (input gain), auto-stop (VAD silence detection) actually drive the recorder.
7. **PWA + polish** — proper icons, offline page, loading skeletons, error boundary, mic permission sheet, online/offline detection, memoization, a11y attributes, `optimizePackageImports`.

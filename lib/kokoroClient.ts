"use client";

/**
 * Direct-from-browser Kokoro client.
 *
 * Why direct: Next.js dev + production both fully buffer binary audio
 * responses (~30s for a typical chat response), defeating Kokoro's
 * streaming. Hitting Kokoro from the browser preserves the ~400ms TTFB
 * and lets MediaSource start playing within ~1s.
 *
 * Kokoro-FastAPI returns proper CORS headers by default, so this works
 * cross-origin from localhost out of the box. For deployed setups you'd
 * need to either co-host Kokoro on the same origin or configure CORS
 * to allow your app's origin.
 */

const KOKORO_VOICE_MAP: Record<string, string> = {
  calm: "af_bella",
  energetic: "af_nova",
  warm: "af_sarah",
  confident: "am_echo",
  smooth: "af_sky",
};

function getBaseUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_KOKORO_URL?.trim();
  if (!url) return null;
  return url.replace(/\/$/, "");
}

export function isKokoroConfigured(): boolean {
  return getBaseUrl() !== null;
}

export function kokoroVoiceFor(voiceId: string): string {
  return KOKORO_VOICE_MAP[voiceId] ?? KOKORO_VOICE_MAP.calm;
}

export interface KokoroSpeakOptions {
  text: string;
  voiceId: string;
  signal?: AbortSignal;
}

/**
 * Returns the raw Kokoro Response. Caller is responsible for consuming
 * `.body` (streaming) or `.blob()` (one-shot). Throws if Kokoro is not
 * configured or the request fails.
 */
export async function kokoroSpeak({
  text,
  voiceId,
  signal,
}: KokoroSpeakOptions): Promise<Response> {
  const base = getBaseUrl();
  if (!base) {
    throw new Error("NEXT_PUBLIC_KOKORO_URL not configured");
  }
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("missing text");
  }

  const response = await fetch(`${base}/v1/audio/speech`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: "kokoro",
      input: trimmed,
      voice: kokoroVoiceFor(voiceId),
      response_format: "mp3",
      stream: true,
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    const errText = await response.text().catch(() => "");
    throw new Error(
      `Kokoro failed (${response.status}): ${errText.slice(0, 160)}`,
    );
  }

  return response;
}

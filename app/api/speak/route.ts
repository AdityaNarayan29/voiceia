export const runtime = "nodejs";

const KOKORO_VOICE_MAP: Record<string, string> = {
  calm: "af_bella",
  energetic: "af_nova",
  warm: "af_sarah",
  confident: "am_echo",
  smooth: "af_sky",
};

interface SpeakRequest {
  text?: string;
  voiceId?: string;
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function callKokoro(
  baseUrl: string,
  text: string,
  voice: string,
): Promise<Response> {
  return fetch(`${baseUrl.replace(/\/$/, "")}/v1/audio/speech`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: "kokoro", input: text, voice }),
  });
}

export async function POST(request: Request) {
  let body: SpeakRequest;
  try {
    body = (await request.json()) as SpeakRequest;
  } catch {
    return jsonError("invalid JSON body", 400);
  }

  const text = body.text?.trim();
  const voiceId = body.voiceId?.trim();
  if (!text) return jsonError("missing text", 400);
  if (!voiceId) return jsonError("missing voiceId", 400);

  const kokoroUrl = process.env.KOKORO_API_URL?.trim();
  if (!kokoroUrl) {
    return jsonError("KOKORO_API_URL not configured", 500);
  }

  const kokoroVoice = KOKORO_VOICE_MAP[voiceId] ?? KOKORO_VOICE_MAP.calm;

  let upstream: Response;
  try {
    upstream = await callKokoro(kokoroUrl, text, kokoroVoice);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "kokoro request failed",
      500,
    );
  }

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => "");
    return jsonError(
      `kokoro failed (${upstream.status}): ${errText.slice(0, 200)}`,
      500,
    );
  }

  return new Response(upstream.body, {
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "audio/mpeg",
      "cache-control": "no-store",
    },
  });
}

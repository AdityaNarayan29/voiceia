import type { Message } from "@/lib/types";

export const runtime = "nodejs";

const SYSTEM_PROMPT =
  "You are a helpful voice assistant. Keep all responses under 3 sentences since they will be spoken aloud. Be natural and conversational. Do not use markdown, bullet points, or formatting.";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

interface ChatRequest {
  message?: string;
  voiceId?: string;
  history?: Message[];
}

interface OpenAIStyleDelta {
  choices?: Array<{ delta?: { content?: string } }>;
}

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GROQ_API_KEY not configured" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return new Response(JSON.stringify({ error: "invalid JSON body" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const message = body.message?.trim();
  if (!message) {
    return new Response(JSON.stringify({ error: "missing message" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const history = Array.isArray(body.history) ? body.history : [];
  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: message },
  ];

  let upstream: Response;
  try {
    upstream = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        stream: true,
        max_tokens: 150,
        messages,
      }),
    });
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "upstream request failed",
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return new Response(
      JSON.stringify({
        error: `groq chat failed (${upstream.status}): ${text.slice(0, 200)}`,
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstream.body.getReader();

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const parsed = JSON.parse(payload) as OpenAIStyleDelta;
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        } catch {
          // skip malformed SSE chunks
        }
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}

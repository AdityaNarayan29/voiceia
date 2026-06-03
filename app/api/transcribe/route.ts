import { NextResponse } from "next/server";

export const runtime = "nodejs";

const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_MODEL = "whisper-large-v3";

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY not configured" },
      { status: 500 },
    );
  }

  let incoming: FormData;
  try {
    incoming = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "invalid form data" },
      { status: 400 },
    );
  }

  const audio = incoming.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json(
      { error: "missing or empty audio file" },
      { status: 400 },
    );
  }

  const outgoing = new FormData();
  outgoing.append("model", GROQ_MODEL);
  outgoing.append(
    "file",
    audio,
    audio instanceof File ? audio.name : "audio.webm",
  );

  let upstream: Response;
  try {
    upstream = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: outgoing,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "upstream request failed" },
      { status: 500 },
    );
  }

  if (!upstream.ok) {
    const body = await upstream.text().catch(() => "");
    return NextResponse.json(
      {
        error: `groq whisper failed (${upstream.status}): ${body.slice(0, 200)}`,
      },
      { status: 500 },
    );
  }

  const data = (await upstream.json().catch(() => null)) as
    | { text?: string }
    | null;
  if (!data?.text) {
    return NextResponse.json(
      { error: "whisper returned no transcript" },
      { status: 500 },
    );
  }

  return NextResponse.json({ transcript: data.text });
}

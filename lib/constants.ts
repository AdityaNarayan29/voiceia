import type { Voice } from "@/lib/types";

export const VOICES: Voice[] = [
  {
    id: "calm",
    name: "Aria",
    tone: "Calm",
    description: "Soft and soothing",
  },
  {
    id: "energetic",
    name: "Nova",
    tone: "Energetic",
    description: "Bright and upbeat",
  },
  {
    id: "warm",
    name: "Sage",
    tone: "Warm",
    description: "Friendly and natural",
  },
  {
    id: "confident",
    name: "Rex",
    tone: "Confident",
    description: "Clear and authoritative",
  },
  {
    id: "smooth",
    name: "Vale",
    tone: "Smooth",
    description: "Calm and polished",
  },
];

export const DEFAULT_VOICE_ID = "calm";

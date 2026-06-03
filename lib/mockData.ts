import type { Conversation } from "@/lib/types";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const BASE_TS = 1717459200000;

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-001",
    timestamp: BASE_TS - 1 * HOUR,
    duration: 42,
    voice: "calm",
    messages: [
      {
        id: "m-001-1",
        role: "user",
        content: "Help me wind down for the night.",
        timestamp: BASE_TS - 1 * HOUR,
      },
      {
        id: "m-001-2",
        role: "assistant",
        content:
          "Let's start by slowing your breath. Inhale for four, hold for four, exhale for six.",
        timestamp: BASE_TS - 1 * HOUR + 8000,
      },
      {
        id: "m-001-3",
        role: "user",
        content: "Okay, that already feels better.",
        timestamp: BASE_TS - 1 * HOUR + 22000,
      },
      {
        id: "m-001-4",
        role: "assistant",
        content: "Good. Stay with that rhythm for another minute.",
        timestamp: BASE_TS - 1 * HOUR + 30000,
      },
    ],
  },
  {
    id: "conv-002",
    timestamp: BASE_TS - 1 * DAY - 3 * HOUR,
    duration: 95,
    voice: "energetic",
    messages: [
      {
        id: "m-002-1",
        role: "user",
        content: "I need a quick pep talk before my standup.",
        timestamp: BASE_TS - 1 * DAY - 3 * HOUR,
      },
      {
        id: "m-002-2",
        role: "assistant",
        content:
          "You've got this. Lead with the win, name one blocker, ask for what you need.",
        timestamp: BASE_TS - 1 * DAY - 3 * HOUR + 10000,
      },
      {
        id: "m-002-3",
        role: "user",
        content: "Win first, blocker, ask. Got it.",
        timestamp: BASE_TS - 1 * DAY - 3 * HOUR + 25000,
      },
    ],
  },
  {
    id: "conv-003",
    timestamp: BASE_TS - 2 * DAY,
    duration: 168,
    voice: "warm",
    messages: [
      {
        id: "m-003-1",
        role: "user",
        content: "Can you help me draft a thank-you note to my mentor?",
        timestamp: BASE_TS - 2 * DAY,
      },
      {
        id: "m-003-2",
        role: "assistant",
        content:
          "Of course. Start with what specifically helped, then how it changed your work.",
        timestamp: BASE_TS - 2 * DAY + 12000,
      },
      {
        id: "m-003-3",
        role: "user",
        content: "She helped me unblock the audio pipeline last sprint.",
        timestamp: BASE_TS - 2 * DAY + 40000,
      },
      {
        id: "m-003-4",
        role: "assistant",
        content:
          "Lead with that. \"Your fix on the audio pipeline unblocked the whole sprint — thank you.\"",
        timestamp: BASE_TS - 2 * DAY + 55000,
      },
    ],
  },
  {
    id: "conv-004",
    timestamp: BASE_TS - 4 * DAY - 6 * HOUR,
    duration: 33,
    voice: "confident",
    messages: [
      {
        id: "m-004-1",
        role: "user",
        content: "Give me one sentence on Postgres LISTEN/NOTIFY.",
        timestamp: BASE_TS - 4 * DAY - 6 * HOUR,
      },
      {
        id: "m-004-2",
        role: "assistant",
        content:
          "It's a lightweight pub/sub built into Postgres — fine for small fan-out, not a replacement for a real broker.",
        timestamp: BASE_TS - 4 * DAY - 6 * HOUR + 9000,
      },
    ],
  },
  {
    id: "conv-005",
    timestamp: BASE_TS - 6 * DAY - 2 * HOUR,
    duration: 124,
    voice: "smooth",
    messages: [
      {
        id: "m-005-1",
        role: "user",
        content: "Walk me through what's on my plate this week.",
        timestamp: BASE_TS - 6 * DAY - 2 * HOUR,
      },
      {
        id: "m-005-2",
        role: "assistant",
        content:
          "Three things are time-bound: the design review Tuesday, the API freeze Thursday, and Friday's retro.",
        timestamp: BASE_TS - 6 * DAY - 2 * HOUR + 14000,
      },
      {
        id: "m-005-3",
        role: "user",
        content: "Which one am I least ready for?",
        timestamp: BASE_TS - 6 * DAY - 2 * HOUR + 38000,
      },
      {
        id: "m-005-4",
        role: "assistant",
        content:
          "The API freeze. Two endpoints still don't have schemas in your draft.",
        timestamp: BASE_TS - 6 * DAY - 2 * HOUR + 52000,
      },
    ],
  },
];

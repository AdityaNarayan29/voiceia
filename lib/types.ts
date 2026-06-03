export type VoiceState =
  | "idle"
  | "listening"
  | "processing"
  | "speaking";

export interface Voice {
  id: string;
  name: string;
  tone: string;
  description: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  timestamp: number;
  duration: number;
  messages: Message[];
  voice: string;
}

export type VoiceAction =
  | { type: "START_LISTENING" }
  | { type: "STOP_LISTENING" }
  | { type: "SET_PROCESSING" }
  | { type: "SET_SPEAKING" }
  | { type: "RESET" }
  | { type: "SET_TRANSCRIPT"; payload: string }
  | { type: "SET_RESPONSE"; payload: string };

export interface VoiceStateShape {
  state: VoiceState;
  transcript: string;
  aiResponse: string;
  isAnimating: boolean;
}

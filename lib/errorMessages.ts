/**
 * Central translator from raw browser/API errors to user-friendly messages.
 *
 * The goal is to give a normal user something actionable. Raw error codes
 * like "not-allowed" or "NotFoundError" are spec strings — they tell a
 * developer what happened but not what to DO. This module turns them into
 * sentences a non-technical user can act on.
 *
 * The classification stays browser-agnostic: we don't sniff Brave or
 * Safari specifically because that ages badly and false-positives.
 * Instead, when something goes wrong we describe the cause and suggest
 * the FEW places it usually comes from (OS mic permission, browser site
 * permission, content blocker / fingerprinting protection).
 */

export type ErrorCategory =
  | "permission"
  | "no-speech"
  | "no-device"
  | "device-busy"
  | "network"
  | "service"
  | "browser-unsupported"
  | "unknown";

export interface FriendlyError {
  category: ErrorCategory;
  /** Short title — fits in a toast or sheet header. */
  title: string;
  /** Longer description — explains cause and remediation. */
  detail: string;
  /** True if this should trigger the MicPermissionSheet. */
  isPermissionIssue: boolean;
}

/**
 * Classify a raw error string from getUserMedia, Web Speech API, or
 * any fetch failure and return a friendly version.
 */
export function classifyError(raw: unknown): FriendlyError {
  const rawStr = (() => {
    if (raw == null) return "";
    if (typeof raw === "string") return raw;
    if (raw instanceof Error) return `${raw.name}: ${raw.message}`;
    return String(raw);
  })();
  const lower = rawStr.toLowerCase();

  // --- Permission family -------------------------------------------------
  // Web Speech: "not-allowed"
  // getUserMedia: NotAllowedError, "Permission denied", "denied"
  if (
    lower.includes("not-allowed") ||
    lower.includes("notallowed") ||
    lower.includes("permission denied") ||
    lower.includes("permission_denied") ||
    /\bdenied\b/.test(lower)
  ) {
    return {
      category: "permission",
      title: "Microphone access blocked",
      detail:
        "Allow microphone access in your browser's site permissions, then reload. If you've already allowed it, check that a privacy extension or browser shield isn't blocking it.",
      isPermissionIssue: true,
    };
  }

  // --- Nothing heard -----------------------------------------------------
  // Web Speech: "no-speech"
  if (lower.includes("no-speech") || lower.includes("no_speech")) {
    return {
      category: "no-speech",
      title: "Didn't catch that",
      detail:
        "No speech was detected. Tap the mic and try again, a little louder or closer.",
      isPermissionIssue: false,
    };
  }

  // --- No device available ---------------------------------------------
  // getUserMedia: NotFoundError, OverconstrainedError (some cases)
  // Web Speech: "audio-capture" (also covers "no mic found" on most browsers)
  if (
    lower.includes("notfound") ||
    lower.includes("not found") ||
    lower.includes("devicesnotfound") ||
    lower.includes("audio-capture") ||
    lower.includes("audio_capture")
  ) {
    return {
      category: "no-device",
      title: "No microphone found",
      detail:
        "Your browser couldn't find a microphone. Check that one is plugged in and selected as the default input, then reload.",
      isPermissionIssue: false,
    };
  }

  // --- Device in use by something else ---------------------------------
  // getUserMedia: NotReadableError, TrackStartError
  if (
    lower.includes("notreadable") ||
    lower.includes("not readable") ||
    lower.includes("trackstart") ||
    lower.includes("in use") ||
    lower.includes("device in use")
  ) {
    return {
      category: "device-busy",
      title: "Microphone is busy",
      detail:
        "Another app or tab is using the microphone. Close it and try again.",
      isPermissionIssue: false,
    };
  }

  // --- Network issues --------------------------------------------------
  // Web Speech: "network"
  // Fetch: TypeError "Failed to fetch", AbortError (timeout), etc.
  if (
    lower.includes("network") ||
    lower.includes("failed to fetch") ||
    lower.includes("load failed") ||
    lower.includes("typeerror: fetch") ||
    lower.includes("err_network")
  ) {
    return {
      category: "network",
      title: "Network issue",
      detail:
        "Couldn't reach the voice service. Check your connection and try again.",
      isPermissionIssue: false,
    };
  }

  // --- Upstream service failures (HTTP 5xx surfaced through our routes) -
  if (
    lower.includes("groq") ||
    lower.includes("whisper") ||
    lower.includes("openai") ||
    lower.includes("kokoro") ||
    /\b5\d{2}\b/.test(lower)
  ) {
    return {
      category: "service",
      title: "Voice service hiccup",
      detail:
        "The AI service didn't respond cleanly. Give it a moment and try again.",
      isPermissionIssue: false,
    };
  }

  // --- Browser doesn't support what we need ----------------------------
  if (
    lower.includes("not supported") ||
    lower.includes("unsupported") ||
    lower.includes("mediadevices") ||
    lower.includes("media devices unavailable")
  ) {
    return {
      category: "browser-unsupported",
      title: "Browser missing support",
      detail:
        "This browser doesn't fully support microphone capture. Try the latest Chrome, Safari, or Firefox.",
      isPermissionIssue: false,
    };
  }

  // --- Web Speech "aborted" is normal (user tapped stop) ---------------
  if (lower.includes("aborted")) {
    return {
      category: "unknown",
      title: "Stopped",
      detail: "Listening was cancelled.",
      isPermissionIssue: false,
    };
  }

  // --- Default ---------------------------------------------------------
  return {
    category: "unknown",
    title: "Something went wrong",
    detail:
      rawStr && rawStr.length < 140
        ? `${rawStr}. Tap the mic to try again.`
        : "An unexpected error stopped the voice loop. Tap the mic to try again.",
    isPermissionIssue: false,
  };
}

/**
 * Convenience: get just the user-facing string (title + detail) for a
 * toast or compact display.
 */
export function friendlyErrorMessage(raw: unknown): string {
  const f = classifyError(raw);
  return `${f.title} — ${f.detail}`;
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface StreamingAudioPlayerHook {
  /**
   * Play a streaming audio Response. Returns a promise that resolves when
   * playback finishes (or rejects if the stream/MediaSource fails fatally).
   */
  playStream: (response: Response, mimeType?: string) => Promise<void>;
  stop: () => void;
  isPlaying: boolean;
  setOnEnd: (cb: (() => void) | null) => void;
}

const DEFAULT_MIME = "audio/mpeg";

function isMediaSourceSupported(mimeType: string): boolean {
  if (typeof window === "undefined") return false;
  if (typeof MediaSource === "undefined") return false;
  return MediaSource.isTypeSupported(mimeType);
}

/**
 * Streams an audio Response into an HTMLAudioElement via MediaSource.
 *
 * Why MediaSource and not just blob playback:
 *   - Kokoro on CPU takes ~70s to fully generate a 3-sentence response.
 *   - But it streams chunks as each sentence finishes (TTFB ~400ms).
 *   - With blob playback we'd wait the full 70s. With MediaSource we
 *     start hearing audio almost immediately.
 *
 * Falls back to whole-blob playback if MediaSource isn't supported for
 * the requested mime (rare for audio/mpeg in modern browsers).
 */
export function useStreamingAudioPlayer(): StreamingAudioPlayerHook {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const onEndRef = useRef<(() => void) | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(
    null,
  );
  const abortedRef = useRef(false);

  const revokeUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const teardown = useCallback(() => {
    abortedRef.current = true;
    if (readerRef.current) {
      readerRef.current.cancel().catch(() => {});
      readerRef.current = null;
    }
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    audioRef.current = null;
    const ms = mediaSourceRef.current;
    if (ms && ms.readyState === "open") {
      try {
        ms.endOfStream();
      } catch {
        // ignore
      }
    }
    mediaSourceRef.current = null;
    sourceBufferRef.current = null;
    revokeUrl();
    setIsPlaying(false);
  }, [revokeUrl]);

  useEffect(() => {
    return () => {
      teardown();
    };
  }, [teardown]);

  const stop = useCallback(() => {
    teardown();
  }, [teardown]);

  const setOnEnd = useCallback((cb: (() => void) | null) => {
    onEndRef.current = cb;
  }, []);

  const playStream = useCallback(
    async (response: Response, mimeType: string = DEFAULT_MIME) => {
      teardown();
      abortedRef.current = false;

      if (!response.body) {
        throw new Error("response has no body to stream");
      }

      // Fallback path: MediaSource unsupported. Read entire blob, then play.
      if (!isMediaSourceSupported(mimeType)) {
        const blob = await response.blob();
        if (abortedRef.current) return;
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        const handleEnd = () => {
          setIsPlaying(false);
          revokeUrl();
          onEndRef.current?.();
        };
        audio.addEventListener("ended", handleEnd);
        audio.addEventListener("error", handleEnd);
        try {
          await audio.play();
          setIsPlaying(true);
        } catch {
          handleEnd();
        }
        return;
      }

      // Streaming path.
      const mediaSource = new MediaSource();
      mediaSourceRef.current = mediaSource;
      const url = URL.createObjectURL(mediaSource);
      objectUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      const handleEnd = () => {
        if (abortedRef.current) return;
        setIsPlaying(false);
        revokeUrl();
        onEndRef.current?.();
      };
      audio.addEventListener("ended", handleEnd);
      audio.addEventListener("error", handleEnd);

      // Wait for MediaSource to be open before we can attach a SourceBuffer.
      await new Promise<void>((resolve, reject) => {
        const onOpen = () => {
          mediaSource.removeEventListener("sourceopen", onOpen);
          resolve();
        };
        const onErr = () => {
          mediaSource.removeEventListener("error", onErr);
          reject(new Error("MediaSource failed to open"));
        };
        mediaSource.addEventListener("sourceopen", onOpen);
        mediaSource.addEventListener("error", onErr);
      });

      if (abortedRef.current) return;

      const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
      sourceBufferRef.current = sourceBuffer;

      const reader = response.body.getReader();
      readerRef.current = reader;
      const queue: Uint8Array[] = [];
      let appending = false;
      let streamDone = false;

      const pump = () => {
        if (abortedRef.current) return;
        if (appending) return;
        if (queue.length === 0) {
          if (streamDone && mediaSource.readyState === "open") {
            try {
              mediaSource.endOfStream();
            } catch {
              // ignore
            }
          }
          return;
        }
        const chunk = queue.shift()!;
        appending = true;
        try {
          // Copy into a fresh ArrayBuffer so TS is happy about
          // BufferSource (rejects Uint8Array<SharedArrayBuffer>).
          const copy = new Uint8Array(chunk.byteLength);
          copy.set(chunk);
          sourceBuffer.appendBuffer(copy.buffer);
        } catch {
          appending = false;
          // Most likely QuotaExceededError or InvalidStateError.
          // Best effort: bail.
          teardown();
          onEndRef.current?.();
        }
      };

      sourceBuffer.addEventListener("updateend", () => {
        appending = false;
        pump();
      });

      // Start playback as soon as we have ANY data.
      const tryStart = () => {
        if (abortedRef.current) return;
        if (audio.paused && audio.readyState >= 2) {
          audio
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => {
              // Autoplay rejected or other issue.
              handleEnd();
            });
        }
      };
      audio.addEventListener("canplay", tryStart);
      audio.addEventListener("loadeddata", tryStart);

      // Stream consumer loop.
      try {
        while (true) {
          if (abortedRef.current) break;
          const { done, value } = await reader.read();
          if (done) {
            streamDone = true;
            pump();
            break;
          }
          if (value && value.byteLength > 0) {
            // Copy into a plain Uint8Array (some readers return shared buffers).
            queue.push(new Uint8Array(value));
            pump();
          }
        }
      } catch (e) {
        if (!abortedRef.current) {
          handleEnd();
          throw e;
        }
      }
    },
    [teardown, revokeUrl],
  );

  return { playStream, stop, isPlaying, setOnEnd };
}

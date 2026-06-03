"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface RecorderOptions {
  /** 0–100 slider value. Higher = more gain + lower silence floor. */
  sensitivity?: number;
  /** Enable silence detection → onSilence fires after silenceMs of quiet. */
  autoStop?: boolean;
  /** Called once VAD detects sustained silence after speech. */
  onSilence?: () => void;
  /** If set (>0), emit a cumulative audio Blob every N ms while recording (for live partial STT). */
  partialIntervalMs?: number;
  /** Called with the cumulative audio Blob whenever a partial chunk is available. */
  onPartialAudio?: (blob: Blob) => void;
}

export interface AudioRecorderHook {
  startRecording: (opts?: RecorderOptions) => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  isRecording: boolean;
  /** Smoothed 0–1 RMS level for UI meters. */
  level: number;
  error: string | null;
}

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

const SILENCE_AFTER_SPEECH_MS = 1500;
const MIN_SPEECH_MS = 500;

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const mime of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return "";
}

/** sensitivity 0–100 → input gain (0.5×–3×). 75 → 2×. */
function gainFromSensitivity(s: number): number {
  const clamped = Math.max(0, Math.min(100, s));
  return 0.5 + (clamped / 100) * 2.5;
}

/** sensitivity 0–100 → RMS silence floor. Higher sensitivity = lower floor. */
function silenceFloorFromSensitivity(s: number): number {
  const clamped = Math.max(0, Math.min(100, s));
  return 0.02 + (1 - clamped / 100) * 0.08;
}

export function useAudioRecorder(): AudioRecorderHook {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const speechStartRef = useRef<number | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const autoStopFiredRef = useRef(false);
  const onSilenceRef = useRef<(() => void) | undefined>(undefined);

  const cleanupAudioGraph = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    setLevel(0);
  }, []);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    cleanupAudioGraph();
    speechStartRef.current = null;
    silenceStartRef.current = null;
    autoStopFiredRef.current = false;
  }, [cleanupAudioGraph]);

  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, [cleanupStream]);

  const startRecording = useCallback(
    async (opts: RecorderOptions = {}) => {
      setError(null);
      onSilenceRef.current = opts.onSilence;
      const sensitivity = opts.sensitivity ?? 75;
      const autoStop = opts.autoStop ?? true;
      const silenceFloor = silenceFloorFromSensitivity(sensitivity);
      const gain = gainFromSensitivity(sensitivity);

      if (typeof navigator === "undefined" || !navigator.mediaDevices) {
        setError("media devices unavailable");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false,
          },
        });
        streamRef.current = stream;

        const mimeType = pickMimeType();
        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);
        chunksRef.current = [];
        const onPartial = opts.onPartialAudio;
        const partialMs = opts.partialIntervalMs ?? 0;
        recorder.ondataavailable = (e) => {
          if (!e.data || e.data.size === 0) return;
          chunksRef.current.push(e.data);
          if (partialMs > 0 && onPartial && chunksRef.current.length > 0) {
            const blob = new Blob(chunksRef.current, {
              type: recorder.mimeType || mimeType || "audio/webm",
            });
            if (blob.size > 0) onPartial(blob);
          }
        };
        if (partialMs > 0) recorder.start(partialMs);
        else recorder.start();
        recorderRef.current = recorder;
        setIsRecording(true);

        const AudioCtor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioCtor) return;
        const ctx = new AudioCtor();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const gainNode = ctx.createGain();
        gainNode.gain.value = gain;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.85;
        source.connect(gainNode);
        gainNode.connect(analyser);
        analyserRef.current = analyser;

        const buf = new Float32Array(analyser.fftSize);
        let smoothed = 0;
        const tick = () => {
          if (!analyserRef.current) return;
          analyser.getFloatTimeDomainData(buf);
          let sumSq = 0;
          for (let i = 0; i < buf.length; i++) sumSq += buf[i] * buf[i];
          const rms = Math.sqrt(sumSq / buf.length);
          smoothed = smoothed * 0.85 + rms * 0.15;
          setLevel(Math.min(1, smoothed * 4));

          if (autoStop && !autoStopFiredRef.current) {
            const now = performance.now();
            if (smoothed > silenceFloor) {
              if (speechStartRef.current === null) speechStartRef.current = now;
              silenceStartRef.current = null;
            } else if (
              speechStartRef.current !== null &&
              now - speechStartRef.current > MIN_SPEECH_MS
            ) {
              if (silenceStartRef.current === null) silenceStartRef.current = now;
              else if (now - silenceStartRef.current > SILENCE_AFTER_SPEECH_MS) {
                autoStopFiredRef.current = true;
                onSilenceRef.current?.();
              }
            }
          }

          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "failed to start recording";
        setError(
          msg.includes("Permission") || msg.includes("NotAllowed")
            ? "microphone permission denied"
            : msg,
        );
        cleanupStream();
      }
    },
    [cleanupStream],
  );

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        cleanupStream();
        setIsRecording(false);
        resolve(null);
        return;
      }
      const mimeType = recorder.mimeType || "audio/webm";
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        cleanupStream();
        setIsRecording(false);
        resolve(blob.size > 0 ? blob : null);
      };
      try {
        recorder.stop();
      } catch {
        cleanupStream();
        setIsRecording(false);
        resolve(null);
      }
    });
  }, [cleanupStream]);

  return { startRecording, stopRecording, isRecording, level, error };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface AudioPlayerHook {
  play: (url: string) => void;
  playBlob: (blob: Blob) => void;
  stop: () => void;
  isPlaying: boolean;
  setOnEnd: (cb: (() => void) | null) => void;
}

export function useAudioPlayer(): AudioPlayerHook {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const onEndRef = useRef<(() => void) | null>(null);

  const revokeUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const teardown = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    audioRef.current = null;
    revokeUrl();
    setIsPlaying(false);
  }, [revokeUrl]);

  useEffect(() => {
    return () => {
      teardown();
    };
  }, [teardown]);

  const play = useCallback(
    (url: string) => {
      teardown();
      const audio = new Audio(url);
      audioRef.current = audio;
      const handleEnded = () => {
        setIsPlaying(false);
        revokeUrl();
        onEndRef.current?.();
      };
      const handleError = () => {
        setIsPlaying(false);
        revokeUrl();
        onEndRef.current?.();
      };
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("error", handleError);
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(false);
          revokeUrl();
          onEndRef.current?.();
        });
    },
    [revokeUrl, teardown],
  );

  const playBlob = useCallback(
    (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      play(url);
    },
    [play],
  );

  const stop = useCallback(() => {
    teardown();
  }, [teardown]);

  const setOnEnd = useCallback((cb: (() => void) | null) => {
    onEndRef.current = cb;
  }, []);

  return { play, playBlob, stop, isPlaying, setOnEnd };
}

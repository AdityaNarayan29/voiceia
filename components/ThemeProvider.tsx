"use client";

import { useEffect, useRef } from "react";
import { useSettings } from "@/lib/useSettings";

const THEME_COLOR_DARK = "#0a0a0f";
const THEME_COLOR_LIGHT = "#f7f7fb";
const FLIP_MS = 320;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, hydrated } = useSettings();
  const prevDark = useRef<boolean | null>(null);
  const flipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hydrated || typeof document === "undefined") return;
    const root = document.documentElement;
    const dark = settings.darkMode;

    const changed = prevDark.current !== null && prevDark.current !== dark;
    if (changed) {
      root.classList.add("theme-flipping");
      if (flipTimer.current) clearTimeout(flipTimer.current);
      flipTimer.current = setTimeout(() => {
        root.classList.remove("theme-flipping");
      }, FLIP_MS);
    }
    prevDark.current = dark;

    root.classList.toggle("dark", dark);

    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = dark ? THEME_COLOR_DARK : THEME_COLOR_LIGHT;
  }, [settings.darkMode, hydrated]);

  useEffect(() => {
    return () => {
      if (flipTimer.current) clearTimeout(flipTimer.current);
    };
  }, []);

  return <>{children}</>;
}

/**
 * Inline script that runs before React hydrates so the right palette is
 * applied on the first paint. Reads the same localStorage key useSettings
 * writes to. Falls back to dark when the key is missing.
 */
export const themeBootScript = `(function(){try{var s=localStorage.getItem('voiceai-settings');var dark=true;if(s){var p=JSON.parse(s);if(typeof p.darkMode==='boolean')dark=p.darkMode;}var r=document.documentElement;if(dark)r.classList.add('dark');else r.classList.remove('dark');}catch(e){document.documentElement.classList.add('dark');}})();`;

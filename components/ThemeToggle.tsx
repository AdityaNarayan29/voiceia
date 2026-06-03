"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

const SPRING = { type: "spring" as const, stiffness: 500, damping: 30 };

export function ThemeToggle({ value, onChange, disabled }: ThemeToggleProps) {
  const dark = value;
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      disabled={disabled}
      onClick={() => onChange(!dark)}
      whileTap={{ scale: 0.94 }}
      transition={SPRING}
      className={cn(
        "relative inline-flex h-9 w-[68px] shrink-0 items-center rounded-full",
        "border transition-colors duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bgPrimary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        dark
          ? "border-accent/30 bg-bgCard"
          : "border-borderStrong bg-bgSecondary",
      )}
      style={{
        boxShadow: dark
          ? "inset 0 0 16px var(--accent-glow), 0 0 0 1px var(--accent-glow)"
          : "inset 0 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      <motion.span
        aria-hidden
        layout
        transition={SPRING}
        className={cn(
          "absolute top-1 flex h-7 w-7 items-center justify-center rounded-full",
          dark
            ? "right-1 bg-accent text-bgPrimary"
            : "left-1 bg-textPrimary text-bgPrimary",
        )}
        style={{
          boxShadow: dark
            ? "0 0 18px var(--accent-glow), 0 2px 6px rgba(0,0,0,0.35)"
            : "0 2px 6px rgba(0,0,0,0.18)",
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {dark ? (
            <motion.span
              key="moon"
              initial={{ rotate: -90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="flex"
            >
              <Moon size={14} strokeWidth={2.2} aria-hidden />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ rotate: 90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="flex"
            >
              <Sun size={14} strokeWidth={2.2} aria-hidden />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>

      <span className="sr-only">
        {dark ? "Dark mode is on" : "Light mode is on"}
      </span>
    </motion.button>
  );
}

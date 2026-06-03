"use client";

import { Mic } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface MicPermissionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INSTRUCTIONS: Array<{ browser: string; steps: string[] }> = [
  {
    browser: "Chrome",
    steps: [
      "Click the padlock icon (or tune icon) in the address bar",
      "Set Microphone to Allow",
      "Reload this page",
    ],
  },
  {
    browser: "Safari",
    steps: [
      "Open Safari → Settings → Websites → Microphone",
      "Find this site and set it to Allow",
      "Reload this page",
    ],
  },
  {
    browser: "Firefox",
    steps: [
      "Click the padlock icon in the address bar",
      "Clear the blocked Microphone permission",
      "Reload, tap mic again, and choose Allow",
    ],
  },
];

function openBrowserSettings() {
  if (typeof window === "undefined") return;
  const ua = window.navigator.userAgent.toLowerCase();
  let target: string | null = null;
  if (ua.includes("chrome") && !ua.includes("edg")) {
    target = "chrome://settings/content/microphone";
  } else if (ua.includes("firefox")) {
    target = "about:preferences#privacy";
  } else if (ua.includes("edg")) {
    target = "edge://settings/content/microphone";
  }
  if (target) {
    window.open(target, "_blank", "noopener,noreferrer");
  }
}

export function MicPermissionSheet({
  open,
  onOpenChange,
}: MicPermissionSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl border-borderSoft bg-bgCard text-textPrimary"
      >
        <SheetHeader className="text-center sm:text-center">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
            <Mic size={32} strokeWidth={2} className="text-error" />
          </div>
          <SheetTitle className="font-syne text-xl font-bold text-textPrimary">
            Microphone Access Required
          </SheetTitle>
          <SheetDescription className="font-geistMono text-xs text-textMuted">
            VoiceAI needs your microphone to hear you. Enable it in your browser
            settings.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex flex-col gap-4">
          {INSTRUCTIONS.map(({ browser, steps }) => (
            <div key={browser} className="rounded-lg border border-borderSoft bg-bgSecondary p-3">
              <p className="mb-2 font-syne text-sm font-semibold text-textPrimary">
                {browser}
              </p>
              <ol className="flex list-decimal flex-col gap-1 pl-5 font-geistMono text-[12px] text-textMuted">
                {steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          ))}

          <Button
            onClick={openBrowserSettings}
            className="min-h-[48px] bg-accent font-syne font-semibold text-bgPrimary hover:bg-accent/90"
          >
            Open Settings
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

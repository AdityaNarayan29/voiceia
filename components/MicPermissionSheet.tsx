"use client";

import { useState } from "react";
import { Mic, Copy, Check } from "lucide-react";
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

interface BrowserGuide {
  browser: string;
  steps: string[];
  /** Optional internal URL (chrome://, brave://, about:) the user can paste. */
  copyUrl?: string;
}

const GUIDES: BrowserGuide[] = [
  {
    browser: "Chrome / Edge / Brave",
    steps: [
      "Click the padlock or tune icon left of the address bar",
      "Set Microphone to Allow",
      "Reload this page",
    ],
    copyUrl: "chrome://settings/content/microphone",
  },
  {
    browser: "Safari",
    steps: [
      "Safari menu → Settings → Websites → Microphone",
      "Find this site in the list and set it to Allow",
      "Reload this page",
    ],
  },
  {
    browser: "Firefox",
    steps: [
      "Click the padlock icon in the address bar",
      "Clear the blocked Microphone permission",
      "Tap the mic again and choose Allow",
    ],
    copyUrl: "about:preferences#privacy",
  },
];

function CopyableUrl({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — user can still select+copy manually
    }
  };
  return (
    <div className="mt-2 flex items-center gap-2 rounded-md border border-borderSoft bg-bgPrimary/40 px-2 py-1.5">
      <code
        className="flex-1 truncate font-geistMono text-[11px] text-textPrimary"
        title={value}
      >
        {value}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "URL copied" : "Copy URL"}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-textMuted transition-colors hover:bg-bgCard hover:text-textPrimary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {copied ? (
          <Check size={12} aria-hidden />
        ) : (
          <Copy size={12} aria-hidden />
        )}
      </button>
    </div>
  );
}

export function MicPermissionSheet({
  open,
  onOpenChange,
}: MicPermissionSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90dvh] overflow-y-auto rounded-t-2xl border-borderSoft bg-bgCard text-textPrimary"
      >
        <SheetHeader className="text-center sm:text-center">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
            <Mic size={32} strokeWidth={2} className="text-error" />
          </div>
          <SheetTitle className="font-syne text-xl font-bold text-textPrimary">
            Microphone access blocked
          </SheetTitle>
          <SheetDescription className="font-geistMono text-xs leading-relaxed text-textMuted">
            VoiceAI couldn&apos;t access your microphone. Allow it in your
            browser&apos;s site permissions, then reload.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {GUIDES.map(({ browser, steps, copyUrl }) => (
            <div
              key={browser}
              className="rounded-lg border border-borderSoft bg-bgSecondary p-3"
            >
              <p className="mb-2 font-syne text-sm font-semibold text-textPrimary">
                {browser}
              </p>
              <ol className="flex list-decimal flex-col gap-1 pl-5 font-geistMono text-[12px] leading-relaxed text-textMuted">
                {steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              {copyUrl && (
                <div>
                  <p className="mt-2 font-geistMono text-[10px] uppercase tracking-wider text-textMuted">
                    Or paste this in your address bar
                  </p>
                  <CopyableUrl value={copyUrl} />
                </div>
              )}
            </div>
          ))}

          <div className="rounded-lg border border-borderSoft bg-bgSecondary/60 p-3">
            <p className="mb-1 font-syne text-sm font-semibold text-textPrimary">
              Still not working?
            </p>
            <ul className="flex list-disc flex-col gap-1 pl-5 font-geistMono text-[12px] leading-relaxed text-textMuted">
              <li>
                Privacy extensions or browser shields (Brave Shields, uBlock,
                etc.) can block microphone access — try disabling them for this
                site.
              </li>
              <li>
                Check that your OS microphone permission isn&apos;t turned off
                for the browser (System Settings → Privacy → Microphone).
              </li>
              <li>Make sure no other app or tab is currently using the mic.</li>
            </ul>
          </div>

          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="min-h-[48px] w-full font-geistMono text-xs text-textMuted hover:bg-bgSecondary hover:text-textPrimary"
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

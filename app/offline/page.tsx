import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <WifiOff size={56} strokeWidth={1.5} className="text-textMuted" />
      <h1 className="font-syne text-2xl font-bold text-textPrimary">
        You&apos;re offline
      </h1>
      <p className="max-w-xs font-geistMono text-sm text-textMuted">
        VoiceAI needs an internet connection to work. Please check your network.
      </p>
    </main>
  );
}

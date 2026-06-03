import { Waveform } from "@/components/Waveform";

export default function GlobalLoading() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center">
      <Waveform state="processing" />
    </main>
  );
}

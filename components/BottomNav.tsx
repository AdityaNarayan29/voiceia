"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tab {
  href: string;
  label: string;
  Icon: typeof Mic;
}

const TABS: Tab[] = [
  { href: "/app", label: "Talk", Icon: Mic },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-borderSoft bg-bgOverlay backdrop-blur-xl"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <ul className="mx-auto flex h-16 max-w-md items-stretch justify-around">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "relative flex h-full min-h-[48px] flex-col items-center justify-center gap-1 transition-colors duration-200 ease-in-out",
                  active ? "text-accent" : "text-textMuted",
                )}
                aria-current={active ? "page" : undefined}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute top-1.5 h-1 w-1 rounded-full bg-accent"
                  />
                )}
                <Icon size={20} strokeWidth={2} aria-hidden />
                <span className="font-geistMono text-[10px]">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

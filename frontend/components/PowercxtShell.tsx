"use client";

import type { ReactNode } from "react";

export type DockTab = "game" | "profile" | "top";

type Props = {
  tab: DockTab;
  onTab: (t: DockTab) => void;
  headerLine?: string;
  heroTitle?: string;
  heroTagline?: string;
  children: ReactNode;
};

const tabs: { id: DockTab; label: string; icon: string }[] = [
  { id: "game", label: "Игра", icon: "⚡" },
  { id: "profile", label: "Профиль", icon: "🧬" },
  { id: "top", label: "Топ", icon: "🏆" },
];

export function PowercxtShell({
  tab,
  onTab,
  headerLine,
  heroTitle = "игра",
  heroTagline = "Тапай, проходи этапы, копи монеты",
  children,
}: Props) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-[#070712] text-zinc-100">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.95]"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% -25%, rgba(139, 92, 246, 0.38), transparent 55%), radial-gradient(ellipse 70% 45% at 110% 40%, rgba(34, 211, 238, 0.14), transparent 50%), radial-gradient(ellipse 55% 35% at -10% 85%, rgba(244, 63, 94, 0.1), transparent 45%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E")`,
          backgroundSize: "80px 80px",
        }}
      />

      <header className="relative z-10 border-b border-white/10 bg-black/25 px-3 pb-3 pt-[max(0.65rem,env(safe-area-inset-top))] backdrop-blur-md min-[400px]:px-4">
        <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-cyan-400/95 min-[380px]:text-[10px] min-[380px]:tracking-[0.4em]">
          POWERCXT
        </p>
        <h1 className="bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text font-mono text-lg font-bold tracking-tight text-transparent min-[400px]:text-xl">
          {heroTitle}
        </h1>
        {headerLine ? (
          <p className="mt-1 break-words font-mono text-[11px] text-zinc-400 min-[400px]:text-xs">
            {headerLine}
          </p>
        ) : (
          <p className="mt-1 text-[11px] leading-snug text-zinc-500 min-[400px]:text-xs">
            {heroTagline}
          </p>
        )}
      </header>

      <main className="relative z-10 mx-auto flex w-full min-w-0 max-w-lg flex-1 flex-col px-2 pb-[calc(5.75rem+env(safe-area-inset-bottom))] pt-2 min-[400px]:px-3 min-[400px]:pt-3 sm:px-4">
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-[#06060d]/95 backdrop-blur-lg"
        style={{
          paddingBottom: "max(0.45rem, env(safe-area-inset-bottom))",
          paddingLeft: "max(0px, env(safe-area-inset-left))",
          paddingRight: "max(0px, env(safe-area-inset-right))",
        }}
      >
        <div className="mx-auto flex max-w-lg justify-around gap-0.5 px-1 pt-1.5 min-[400px]:gap-1 min-[400px]:px-2 min-[400px]:pt-2">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTab(t.id)}
                className={`powercxt-tap-target flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center rounded-2xl px-1.5 py-2 min-[400px]:px-2 ${
                  active
                    ? "bg-gradient-to-b from-violet-600/45 to-cyan-500/15 text-white shadow-[0_0_28px_rgba(139,92,246,0.28)]"
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                } transition active:scale-[0.98]`}
              >
                <span className="text-[1.2rem] leading-none min-[400px]:text-[1.35rem]">
                  {t.icon}
                </span>
                <span className="mt-0.5 max-w-full truncate text-[10px] font-semibold min-[400px]:text-[11px]">
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

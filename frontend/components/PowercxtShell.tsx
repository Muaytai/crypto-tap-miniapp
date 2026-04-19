"use client";

import type { ReactNode } from "react";

export type DockTab = "game" | "profile" | "top";

type Props = {
  tab: DockTab;
  onTab: (t: DockTab) => void;
  headerLine?: string;
  children: ReactNode;
};

const tabs: { id: DockTab; label: string; icon: string }[] = [
  { id: "game", label: "Игра", icon: "⚡" },
  { id: "profile", label: "Профиль", icon: "🧬" },
  { id: "top", label: "Топ", icon: "🏆" },
];

export function PowercxtShell({ tab, onTab, headerLine, children }: Props) {
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

      <header className="relative z-10 border-b border-white/10 bg-black/25 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-cyan-400/95">
          POWERCXT
        </p>
        <h1 className="bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text font-mono text-xl font-bold tracking-tight text-transparent">
          игра
        </h1>
        {headerLine ? (
          <p className="mt-1 font-mono text-xs text-zinc-400">{headerLine}</p>
        ) : (
          <p className="mt-1 text-xs text-zinc-500">
            Тапай, проходи этапы, копи монеты
          </p>
        )}
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-3">
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-[#06060d]/95 backdrop-blur-lg"
        style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-lg justify-around gap-1 px-2 pt-2">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTab(t.id)}
                className={`flex min-w-0 flex-1 flex-col items-center rounded-2xl px-2 py-2 transition active:scale-[0.98] ${
                  active
                    ? "bg-gradient-to-b from-violet-600/45 to-cyan-500/15 text-white shadow-[0_0_28px_rgba(139,92,246,0.28)]"
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                }`}
              >
                <span className="text-[1.35rem] leading-none">{t.icon}</span>
                <span className="mt-0.5 text-[11px] font-semibold">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

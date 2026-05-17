"use client";

/**
 * Фон вкладки «Цели»: приглушённая «комната трейдера» + сетка, не перехватывает клики.
 */
export function GoalsRoomBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[linear-gradient(165deg,#070b14_0%,#121c32_42%,#1a0f24_78%,#0d0812_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(56,189,248,0.08) 1px, transparent 1px),
            linear-gradient(rgba(56,189,248,0.06) 1px, transparent 1px)
          `,
          backgroundSize: "16px 16px",
        }}
      />
      <div className="absolute left-1/2 top-0 h-40 w-56 -translate-x-1/2 bg-violet-600/20 blur-3xl" />
      <div className="absolute bottom-[20%] left-[8%] h-24 w-32 rounded-lg border border-cyan-500/20 bg-cyan-950/30 opacity-60" />
      <div className="absolute bottom-[28%] right-[6%] h-20 w-28 rounded border border-amber-500/15 bg-amber-950/20 opacity-50" />
      <p className="absolute left-1/2 top-[18%] -translate-x-1/2 font-pixel text-[9px] uppercase tracking-[0.35em] text-cyan-400/25">
        CRYPTO IS FREEDOM
      </p>
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#070b14] via-[#070b14]/80 to-transparent" />
    </div>
  );
}

"use client";

/**
 * Фон вкладки «Цели»: приглушённая «комната трейдера» + сетка, не перехватывает клики.
 */
export function GoalsRoomBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[linear-gradient(165deg,#070b14_0%,#0f1625_50%,#1a0f24_100%)]" />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(34,211,238,0.1) 1px, transparent 1px),
            linear-gradient(rgba(34,211,238,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
        }}
      />
      <div className="absolute left-1/2 top-12 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute bottom-20 right-8 h-40 w-40 rounded-3xl border border-cyan-500/20 bg-cyan-950/30" />
    </div>
  );
}
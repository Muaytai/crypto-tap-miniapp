"use client";

/**
 * Декоративный фон лабы: градиент, сетка, мягкое свечение и лёгкие искры — без прямоугольных блоков/стоек.
 * Не перехватывает клики (pointer-events: none).
 */
export function MiningRoomBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 min-h-full w-full overflow-hidden"
      aria-hidden
    >
      {/* База: холодный подвал + фиолетовый снизу */}
      <div
        className="absolute inset-0 bg-[linear-gradient(165deg,#070b14_0%,#121c32_38%,#1a0f24_72%,#0d0812_100%)]"
      />
      {/* «Кирпич / плитка» дата-центра */}
      <div
        className="absolute inset-0 opacity-[0.14] mix-blend-soft-light"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(56,189,248,0.06) 1px, transparent 1px),
            linear-gradient(rgba(56,189,248,0.05) 1px, transparent 1px),
            linear-gradient(180deg, transparent 60%, rgba(168,85,247,0.04) 100%)
          `,
          backgroundSize: "14px 14px, 14px 14px, 100% 100%",
        }}
      />
      {/* Подсветка за центром тапа */}
      <div className="absolute left-1/2 top-[32%] h-48 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/12 blur-3xl" />
      <div className="absolute left-1/2 top-[36%] h-32 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-2xl" />

      {/* Пол / перспектива */}
      <div
        className="absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(to_top,rgba(8,6,12,0.95)_0%,rgba(15,20,35,0.5)_45%,transparent_100%)]"
      />

      <svg
        className="absolute bottom-0 left-1/2 h-[min(88dvh,780px)] w-full max-w-full -translate-x-1/2 opacity-[0.55] [image-rendering:crisp-edges]"
        viewBox="0 0 360 640"
        preserveAspectRatio="xMidYMax meet"
        aria-hidden
      >
        {/* Лёгкие блики как в референсе (+ / искры), без прямоугольных «панелей» */}
        {[
          [200, 200],
          [168, 260],
          [232, 248],
          [190, 340],
          [210, 400],
        ].map(([x, y], i) => (
          <g key={i} opacity={0.65}>
            <path
              d={`M${x} ${y - 3} L${x} ${y + 3} M${x - 3} ${y} L${x + 3} ${y}`}
              stroke="#e0f2fe"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </g>
        ))}
      </svg>

      {/* Лёгкая сетка «matrix» */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px)",
          backgroundSize: "100% 3px",
        }}
      />
    </div>
  );
}

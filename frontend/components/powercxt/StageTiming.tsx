"use client";

import { useEffect, useRef, useState } from "react";
import { playPowercxtSound } from "@/lib/powercxt-feedback";

type Props = {
  hitsNeeded: number;
  greenMin: number;
  greenMax: number;
  onComplete: () => void;
  reportTap: (n?: number) => void;
};

export function StageTiming({ hitsNeeded, greenMin, greenMax, onComplete, reportTap }: Props) {
  const [needle, setNeedle] = useState(50);
  const [hits, setHits] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const lastTry = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const t = Date.now() / 1000;
      setNeedle((Math.sin(t * 2.6) * 0.5 + 0.5) * 100);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const tryHit = () => {
    const now = Date.now();
    if (now - lastTry.current < 320) return;
    lastTry.current = now;

    if (needle >= greenMin && needle <= greenMax) {
      playPowercxtSound("success");
      reportTap(1);
      setHits((h) => {
        const n = h + 1;
        if (n >= hitsNeeded && !doneRef.current) {
          doneRef.current = true;
          queueMicrotask(() => onComplete());
        }
        return n;
      });
      setHint("В зоне!");
    } else {
      playPowercxtSound("warn");
      setHint("Мимо — ждите зелёный сектор");
    }
    window.setTimeout(() => setHint(null), 500);
  };

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-4 min-[400px]:gap-6">
      <p className="text-base font-medium text-zinc-200 min-[400px]:text-lg">
        Попаданий {hits} / {hitsNeeded}
      </p>
      <div className="relative h-12 w-full max-w-sm rounded-xl bg-white/10 min-[400px]:h-14">
        <div
          className="absolute inset-y-2 rounded-md bg-emerald-500/35"
          style={{
            left: `${greenMin}%`,
            width: `${greenMax - greenMin}%`,
          }}
        />
        <div
          className="absolute top-1 bottom-1 w-1.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]"
          style={{ left: `calc(${needle}% - 3px)` }}
        />
      </div>
      <p className="max-w-sm px-1 text-center text-[11px] text-zinc-400 min-[400px]:text-xs">
        Индикатор движется сам — нажмите в нужный момент
      </p>
      {hint && <p className="text-sm text-cyan-300">{hint}</p>}
      <button
        type="button"
        onClick={tryHit}
        className="powercxt-tap-target w-full max-w-xs rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 text-base font-semibold text-white shadow-lg transition active:scale-95 min-[400px]:px-10 min-[400px]:py-5 min-[400px]:text-lg"
      >
        СИНХРОНИЗАЦИЯ
      </button>
    </div>
  );
}

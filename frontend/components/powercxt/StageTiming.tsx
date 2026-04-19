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
    <div className="flex flex-col items-center gap-6">
      <p className="text-lg font-medium text-zinc-800">
        Попаданий {hits} / {hitsNeeded}
      </p>
      <div className="relative h-14 w-full max-w-sm rounded-xl bg-zinc-200">
        <div
          className="absolute inset-y-2 rounded-md bg-emerald-400/50"
          style={{
            left: `${greenMin}%`,
            width: `${greenMax - greenMin}%`,
          }}
        />
        <div
          className="absolute top-1 bottom-1 w-1.5 rounded-full bg-zinc-900 shadow"
          style={{ left: `calc(${needle}% - 3px)` }}
        />
      </div>
      <p className="text-xs text-zinc-500">Индикатор движется сам — нажмите в нужный момент</p>
      {hint && <p className="text-sm text-indigo-600">{hint}</p>}
      <button
        type="button"
        onClick={tryHit}
        className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-10 py-5 text-lg font-semibold text-white shadow-lg transition active:scale-95"
      >
        СИНХРОНИЗАЦИЯ
      </button>
    </div>
  );
}

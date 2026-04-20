"use client";

import { useRef, useState } from "react";
import { playPowercxtSound } from "@/lib/powercxt-feedback";

type Props = {
  onComplete: () => void;
  reportTap: (n?: number) => void;
};

export function StageMeter({ onComplete, reportTap }: Props) {
  const [value, setValue] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const doneRef = useRef(false);

  const tap = () => {
    if (doneRef.current) return;
    const crit = Math.random() < 0.12;
    const add = crit ? 12 + Math.floor(Math.random() * 6) : 2 + Math.floor(Math.random() * 4);
    reportTap(1);
    setFlash(crit ? `Крит +${add}!` : null);
    if (crit) {
      window.setTimeout(() => setFlash(null), 600);
    }
    setValue((v) => {
      const n = Math.min(100, v + add);
      if (n >= 100 && !doneRef.current) {
        doneRef.current = true;
        playPowercxtSound("success");
        queueMicrotask(() => onComplete());
      } else {
        playPowercxtSound(crit ? "success" : "tap");
      }
      return n;
    });
  };

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-5 min-[400px]:gap-6">
      <div className="relative h-7 w-full max-w-sm overflow-hidden rounded-full bg-white/10 min-[400px]:h-8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 transition-[width] duration-200"
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-2xl font-bold tabular-nums text-zinc-100 min-[400px]:text-3xl">{value}%</p>
      {flash && <p className="animate-pulse text-sm font-semibold text-fuchsia-300">{flash}</p>}
      <button
        type="button"
        onClick={tap}
        className="powercxt-tap-target flex h-[clamp(6.75rem,34vmin,9rem)] w-[clamp(6.75rem,34vmin,9rem)] max-h-36 max-w-36 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-600 text-sm font-semibold text-white shadow-xl transition active:scale-95 min-[400px]:text-base"
      >
        ЗАРЯД
      </button>
    </div>
  );
}

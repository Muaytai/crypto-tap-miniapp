"use client";

import { useRef, useState } from "react";
import { playPowercxtSound } from "@/lib/powercxt-feedback";

type Props = {
  target: number;
  onComplete: () => void;
  reportTap: (n?: number) => void;
};

export function StageFinalBurst({ target, onComplete, reportTap }: Props) {
  const [count, setCount] = useState(0);
  const doneRef = useRef(false);

  const tap = () => {
    if (doneRef.current) return;
    reportTap(1);
    setCount((c) => {
      const n = c + 1;
      if (n >= target && !doneRef.current) {
        doneRef.current = true;
        playPowercxtSound("success");
        queueMicrotask(() => onComplete());
      } else {
        playPowercxtSound("tap");
      }
      return n;
    });
  };

  const pct = Math.min(100, (count / target) * 100);

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-6 min-[400px]:gap-8">
      <div className="grid w-full max-w-[min(100%,20rem)] grid-cols-5 gap-1 px-1 min-[400px]:max-w-xs">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-colors ${
              pct > i * 20 ? "bg-indigo-500" : "bg-zinc-600"
            }`}
          />
        ))}
      </div>
      <p className="text-2xl font-bold tabular-nums text-zinc-100 min-[400px]:text-3xl">
        {count} / {target}
      </p>
      <button
        type="button"
        onClick={tap}
        className="powercxt-tap-target flex h-[clamp(7.25rem,38vmin,11rem)] w-[clamp(7.25rem,38vmin,11rem)] max-h-44 max-w-44 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-base font-bold text-white shadow-2xl ring-2 ring-violet-500/35 transition active:scale-95 min-[400px]:text-lg min-[400px]:ring-4"
      >
        POWER
      </button>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { playPowercxtSound } from "@/lib/powercxt-feedback";

type Props = {
  target: number;
  onComplete: () => void;
  reportTap: (n?: number) => void;
};

export function StageTapRun({ target, onComplete, reportTap }: Props) {
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
    <div className="flex w-full min-w-0 flex-col items-center gap-5 min-[400px]:gap-8">
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10 min-[400px]:h-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-150"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-2xl font-bold tabular-nums text-zinc-100 min-[400px]:text-3xl">
        {count} / {target}
      </p>
      <button
        type="button"
        onClick={tap}
        className="powercxt-tap-target powercxt-pulse-soft flex h-[clamp(7rem,36vmin,10rem)] w-[clamp(7rem,36vmin,10rem)] max-h-40 max-w-40 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-base font-semibold text-white shadow-xl transition duration-150 active:scale-95 min-[400px]:text-lg"
      >
        ТАП
      </button>
    </div>
  );
}

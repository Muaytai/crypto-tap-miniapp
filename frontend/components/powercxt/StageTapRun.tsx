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
    <div className="flex flex-col items-center gap-8">
      <div className="relative h-4 w-full overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-150"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-3xl font-bold tabular-nums text-zinc-900">
        {count} / {target}
      </p>
      <button
        type="button"
        onClick={tap}
        className="powercxt-pulse-soft flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-semibold text-white shadow-xl transition duration-150 active:scale-95"
      >
        ИМПУЛЬС
      </button>
    </div>
  );
}

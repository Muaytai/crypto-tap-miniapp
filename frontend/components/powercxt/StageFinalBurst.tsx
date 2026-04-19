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
    <div className="flex flex-col items-center gap-8">
      <div className="grid w-full max-w-xs grid-cols-5 gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-colors ${
              pct > i * 20 ? "bg-indigo-500" : "bg-zinc-200"
            }`}
          />
        ))}
      </div>
      <p className="text-3xl font-bold tabular-nums text-zinc-900">
        {count} / {target}
      </p>
      <button
        type="button"
        onClick={tap}
        className="flex h-44 w-44 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-lg font-bold text-white shadow-2xl ring-4 ring-indigo-200/50 transition active:scale-95"
      >
        POWER
      </button>
    </div>
  );
}

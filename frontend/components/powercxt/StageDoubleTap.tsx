"use client";

import { useRef, useState } from "react";
import { playPowercxtSound } from "@/lib/powercxt-feedback";

type Props = {
  doublesNeeded: number;
  windowMs: number;
  onComplete: () => void;
  reportTap: (n?: number) => void;
};

export function StageDoubleTap({
  doublesNeeded,
  windowMs,
  onComplete,
  reportTap,
}: Props) {
  const [count, setCount] = useState(0);
  const lastDown = useRef(0);
  const doneRef = useRef(false);

  const onTap = () => {
    if (doneRef.current) return;
    const now = Date.now();
    const dt = now - lastDown.current;

    if (lastDown.current > 0 && dt < windowMs && dt > 35) {
      lastDown.current = 0;
      playPowercxtSound("success");
      reportTap(2);
      setCount((c) => {
        const n = c + 1;
        if (n >= doublesNeeded && !doneRef.current) {
          doneRef.current = true;
          queueMicrotask(() => onComplete());
        }
        return n;
      });
      return;
    }

    lastDown.current = now;
    playPowercxtSound("tap");
  };

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-6 min-[400px]:gap-8">
      <p className="px-2 text-center text-xs text-zinc-400 min-[400px]:text-sm">
        Двойных серий: <span className="font-semibold text-zinc-100">{count}</span> /{" "}
        {doublesNeeded}
      </p>
      <p className="max-w-xs px-2 text-center text-[11px] text-zinc-500 min-[400px]:text-xs">
        Два быстрых нажатия подряд (окно {windowMs} мс)
      </p>
      <button
        type="button"
        onClick={onTap}
        className="powercxt-tap-target flex h-[clamp(7.25rem,38vmin,11rem)] w-[clamp(7.25rem,38vmin,11rem)] max-h-44 max-w-44 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-rose-600 text-base font-bold text-white shadow-xl transition duration-150 hover:brightness-105 active:scale-95 min-[400px]:text-lg"
      >
        ×2
      </button>
    </div>
  );
}

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
    <div className="flex flex-col items-center gap-8">
      <p className="text-center text-sm text-zinc-600">
        Двойных серий: <span className="font-semibold text-zinc-900">{count}</span> /{" "}
        {doublesNeeded}
      </p>
      <p className="max-w-xs text-center text-xs text-zinc-500">
        Два быстрых нажатия подряд (окно {windowMs} мс)
      </p>
      <button
        type="button"
        onClick={onTap}
        className="flex h-44 w-44 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-rose-600 text-lg font-bold text-white shadow-xl transition duration-150 hover:brightness-105 active:scale-95"
      >
        ×2
      </button>
    </div>
  );
}

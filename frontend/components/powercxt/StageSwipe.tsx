"use client";

import { useRef, useState } from "react";
import { playPowercxtSound } from "@/lib/powercxt-feedback";

type Props = {
  swipesNeeded: number;
  minDeltaY: number;
  onComplete: () => void;
  reportTap: (n?: number) => void;
};

export function StageSwipe({
  swipesNeeded,
  minDeltaY,
  onComplete,
  reportTap,
}: Props) {
  const [count, setCount] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const startY = useRef<number | null>(null);
  const doneRef = useRef(false);
  const tracking = useRef(false);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if (doneRef.current) return;
    tracking.current = true;
    startY.current = e.clientY;
    const el = surfaceRef.current;
    if (el && "setPointerCapture" in el) {
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!tracking.current || doneRef.current || startY.current == null) {
      tracking.current = false;
      return;
    }
    tracking.current = false;
    const dy = startY.current - e.clientY;
    startY.current = null;

    if (dy >= minDeltaY) {
      playPowercxtSound("tap");
      reportTap(1);
      setCount((c) => {
        const n = c + 1;
        if (n >= swipesNeeded && !doneRef.current) {
          doneRef.current = true;
          playPowercxtSound("success");
          queueMicrotask(() => onComplete());
        }
        return n;
      });
      setHint(null);
    } else if (dy > 20) {
      playPowercxtSound("warn");
      setHint("Сильнее вверх");
      window.setTimeout(() => setHint(null), 600);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-lg font-medium text-zinc-800">
        Свайпов {count} / {swipesNeeded}
      </p>
      <div
        ref={surfaceRef}
        role="application"
        aria-label="Свайп вверх"
        className="flex h-52 w-full max-w-sm touch-none select-none flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-300 bg-gradient-to-b from-indigo-50 to-white p-6 text-center shadow-inner transition-transform active:scale-[0.99]"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          tracking.current = false;
          startY.current = null;
        }}
      >
        <p className="pointer-events-none text-sm font-medium text-indigo-800">
          Ведите вверх
        </p>
        <p className="pointer-events-none mt-2 text-4xl">↑</p>
        <p className="pointer-events-none mt-3 text-xs text-zinc-500">
          Удержали и провели пальцем / мышью вверх
        </p>
      </div>
      {hint && <p className="text-sm text-amber-700">{hint}</p>}
    </div>
  );
}

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
    <div className="flex w-full min-w-0 flex-col items-center gap-4 min-[400px]:gap-6">
      <p className="text-base font-medium text-zinc-200 min-[400px]:text-lg">
        Свайпов {count} / {swipesNeeded}
      </p>
      <div
        ref={surfaceRef}
        role="application"
        aria-label="Свайп вверх"
        className="flex h-[min(42vh,12.5rem)] min-h-[10.5rem] w-full max-w-sm touch-none select-none flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-500/45 bg-gradient-to-b from-violet-950/50 to-black/30 p-4 text-center shadow-inner transition-transform active:scale-[0.99] min-[400px]:h-52 min-[400px]:p-6"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          tracking.current = false;
          startY.current = null;
        }}
      >
        <p className="pointer-events-none text-sm font-medium text-violet-200">
          Ведите вверх
        </p>
        <p className="pointer-events-none mt-2 text-4xl text-cyan-200">↑</p>
        <p className="pointer-events-none mt-3 text-xs text-zinc-400">
          Удержали и провели пальцем / мышью вверх
        </p>
      </div>
      {hint && <p className="text-sm text-amber-300">{hint}</p>}
    </div>
  );
}

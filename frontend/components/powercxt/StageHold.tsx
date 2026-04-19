"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { playPowercxtSound } from "@/lib/powercxt-feedback";

type Props = {
  holdsNeeded: number;
  holdMs: number;
  onComplete: () => void;
  reportTap: (n?: number) => void;
};

export function StageHold({ holdsNeeded, holdMs, onComplete, reportTap }: Props) {
  const [completed, setCompleted] = useState(0);
  const [pressing, setPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  const clearRaf = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const endPress = useCallback(
    (success: boolean) => {
      clearRaf();
      setPressing(false);
      setProgress(0);
      startRef.current = null;
      if (success) {
        playPowercxtSound("success");
        reportTap(1);
        setCompleted((c) => {
          const n = c + 1;
          if (n >= holdsNeeded && !finishedRef.current) {
            finishedRef.current = true;
            queueMicrotask(() => onComplete());
          }
          return n;
        });
      }
    },
    [holdsNeeded, onComplete, reportTap],
  );

  useEffect(() => {
    return () => clearRaf();
  }, []);

  const loop = useCallback(() => {
    const start = startRef.current;
    if (start == null) return;
    const elapsed = Date.now() - start;
    const p = Math.min(100, (elapsed / holdMs) * 100);
    setProgress(p);
    if (elapsed >= holdMs) {
      endPress(true);
      return;
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [holdMs, endPress]);

  const onDown = () => {
    if (completed >= holdsNeeded) return;
    setPressing(true);
    startRef.current = Date.now();
    rafRef.current = requestAnimationFrame(loop);
  };

  const onUp = () => {
    if (!pressing || startRef.current == null) return;
    const elapsed = Date.now() - startRef.current;
    clearRaf();
    setPressing(false);
    setProgress(0);
    startRef.current = null;
    if (elapsed < holdMs) {
      /* отпустили рано — без засчёта */
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <p className="text-lg font-medium text-zinc-800">
        Удержание {completed} / {holdsNeeded}
      </p>
      <div className="relative h-6 w-full max-w-xs overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-[width]"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="max-w-xs text-center text-sm text-zinc-500">
        Зажмите кнопку и не отпускайте ~{(holdMs / 1000).toFixed(1)} с
      </p>
      <button
        type="button"
        className="flex h-44 w-44 select-none items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-semibold text-white shadow-xl touch-manipulation active:scale-95"
        onPointerDown={(e) => {
          e.preventDefault();
          onDown();
        }}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        onPointerCancel={onUp}
      >
        {pressing ? "ДЕРЖИ…" : "ЗАЖАТЬ"}
      </button>
    </div>
  );
}

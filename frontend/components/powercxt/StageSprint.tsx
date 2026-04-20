"use client";

import { useEffect, useRef, useState } from "react";
import { playPowercxtSound } from "@/lib/powercxt-feedback";

type Props = {
  durationMs: number;
  minTaps: number;
  onComplete: () => void;
  reportTap: (n?: number) => void;
};

export function StageSprint({ durationMs, minTaps, onComplete, reportTap }: Props) {
  const [taps, setTaps] = useState(0);
  const [left, setLeft] = useState(durationMs);
  const [done, setDone] = useState(false);
  const started = useRef(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (done) return;
    const t0 = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - t0;
      const rem = Math.max(0, durationMs - elapsed);
      setLeft(rem);
      if (rem <= 0) {
        window.clearInterval(id);
        setDone(true);
      }
    }, 50);
    return () => window.clearInterval(id);
  }, [durationMs, done]);

  useEffect(() => {
    if (!done) return;
    if (taps >= minTaps && !completedRef.current) {
      completedRef.current = true;
      queueMicrotask(() => onComplete());
    }
  }, [done, taps, minTaps, onComplete]);

  const tap = () => {
    if (done || left <= 0) return;
    if (!started.current) started.current = true;
    playPowercxtSound("tap");
    reportTap(1);
    setTaps((t) => t + 1);
  };

  const failed = done && taps < minTaps;

  const retry = () => {
    setTaps(0);
    setLeft(durationMs);
    setDone(false);
    started.current = false;
    completedRef.current = false;
  };

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-4 min-[400px]:gap-6">
      <div
        className={`text-4xl font-bold tabular-nums min-[400px]:text-5xl ${left < 2000 ? "text-rose-400" : "text-zinc-100"}`}
      >
        {(left / 1000).toFixed(2)}с
      </div>
      <p className="max-w-[20rem] text-center text-xs text-zinc-400 min-[400px]:text-sm">
        Нужно не меньше <span className="font-semibold text-zinc-200">{minTaps}</span> тапов
        за время.
      </p>
      <p className="text-xl font-semibold tabular-nums text-cyan-300 min-[400px]:text-2xl">
        {taps} тапов
      </p>
      {failed && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-center text-sm text-rose-400">Не хватило тапов. Ещё раз!</p>
          <button
            type="button"
            onClick={retry}
            className="powercxt-tap-target min-h-[48px] rounded-xl bg-white/15 px-5 py-3 text-sm font-medium text-white ring-1 ring-white/20"
          >
            Повторить этап
          </button>
        </div>
      )}
      {!failed && (
        <button
          type="button"
          onClick={tap}
          disabled={done && taps >= minTaps}
          className="powercxt-tap-target flex h-[clamp(7rem,36vmin,10rem)] w-[clamp(7rem,36vmin,10rem)] max-h-40 max-w-40 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-base font-semibold text-white shadow-xl transition active:scale-95 disabled:opacity-60 min-[400px]:text-lg"
        >
          СПРИНТ
        </button>
      )}
    </div>
  );
}

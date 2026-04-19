"use client";

import { useEffect, useRef, useState } from "react";

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
    <div className="flex flex-col items-center gap-6">
      <div
        className={`text-5xl font-bold tabular-nums ${left < 2000 ? "text-rose-600" : "text-zinc-900"}`}
      >
        {(left / 1000).toFixed(2)}с
      </div>
      <p className="text-center text-sm text-zinc-600">
        Нужно не меньше <span className="font-semibold text-zinc-800">{minTaps}</span> тапов
        за время.
      </p>
      <p className="text-2xl font-semibold tabular-nums text-indigo-600">{taps} тапов</p>
      {failed && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-center text-sm text-rose-600">Не хватило импульсов. Ещё раз!</p>
          <button
            type="button"
            onClick={retry}
            className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white"
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
          className="flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-lg font-semibold text-white shadow-xl transition active:scale-95 disabled:opacity-60"
        >
          СПРИНТ
        </button>
      )}
    </div>
  );
}

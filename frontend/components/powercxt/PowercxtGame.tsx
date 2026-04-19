"use client";

import { useCallback, useEffect, useState } from "react";
import {
  POWERCXT_STAGES,
  loadStageIndex,
  saveStageIndex,
  POWERCXT_STORAGE_KEY,
} from "@/lib/powercxt-stages";
import {
  isPowercxtMuted,
  setPowercxtMuted,
} from "@/lib/powercxt-feedback";
import { PowercxtFinale } from "@/components/PowercxtFinale";
import { StageTapRun } from "@/components/powercxt/StageTapRun";
import { StageSprint } from "@/components/powercxt/StageSprint";
import { StageHold } from "@/components/powercxt/StageHold";
import { StageTiming } from "@/components/powercxt/StageTiming";
import { StageMeter } from "@/components/powercxt/StageMeter";
import { StageSwipe } from "@/components/powercxt/StageSwipe";
import { StageDoubleTap } from "@/components/powercxt/StageDoubleTap";
import { StageFinalBurst } from "@/components/powercxt/StageFinalBurst";

type Props = {
  reportTap: (n?: number) => void;
};

export function PowercxtGame({ reportTap }: Props) {
  const [ready, setReady] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(isPowercxtMuted());
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reset") === "1") {
      try {
        localStorage.removeItem(POWERCXT_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      window.history.replaceState({}, "", window.location.pathname);
      setStageIndex(0);
      saveStageIndex(0);
    } else {
      setStageIndex(loadStageIndex());
    }
    setReady(true);
  }, []);

  const advance = useCallback(() => {
    setStageIndex((i) => {
      const next = i + 1;
      saveStageIndex(next);
      return next;
    });
  }, []);

  const toggleMute = () => {
    const next = !isPowercxtMuted();
    setPowercxtMuted(next);
    setMuted(next);
  };

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-zinc-500">
        Загрузка…
      </div>
    );
  }

  if (stageIndex >= POWERCXT_STAGES.length) {
    return <PowercxtFinale />;
  }

  const meta = POWERCXT_STAGES[stageIndex];

  return (
    <div className="flex w-full max-w-md flex-col gap-6 px-4 py-6">
      <header className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-600">
          POWERCXT
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Этап {stageIndex + 1} из {POWERCXT_STAGES.length}
        </p>
        <h2 className="mt-2 text-xl font-semibold text-zinc-900">{meta.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{meta.tagline}</p>
      </header>

      <div
        key={stageIndex}
        className="powercxt-stage-in rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
      >
        {stageIndex === 0 && (
          <StageTapRun target={52} onComplete={advance} reportTap={reportTap} />
        )}
        {stageIndex === 1 && (
          <StageSprint
            durationMs={12000}
            minTaps={42}
            onComplete={advance}
            reportTap={reportTap}
          />
        )}
        {stageIndex === 2 && (
          <StageHold
            holdsNeeded={3}
            holdMs={2200}
            onComplete={advance}
            reportTap={reportTap}
          />
        )}
        {stageIndex === 3 && (
          <StageTiming
            hitsNeeded={5}
            greenMin={40}
            greenMax={60}
            onComplete={advance}
            reportTap={reportTap}
          />
        )}
        {stageIndex === 4 && <StageMeter onComplete={advance} reportTap={reportTap} />}
        {stageIndex === 5 && (
          <StageSwipe
            swipesNeeded={8}
            minDeltaY={72}
            onComplete={advance}
            reportTap={reportTap}
          />
        )}
        {stageIndex === 6 && (
          <StageDoubleTap
            doublesNeeded={10}
            windowMs={320}
            onComplete={advance}
            reportTap={reportTap}
          />
        )}
        {stageIndex === 7 && (
          <StageFinalBurst target={72} onComplete={advance} reportTap={reportTap} />
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={toggleMute}
          className="text-xs text-zinc-500 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-700"
        >
          {muted ? "Включить звук" : "Без звука"}
        </button>
        <p className="text-center text-xs text-zinc-400">
          Прогресс сохраняется в браузере. Сброс:{" "}
          <code className="rounded bg-zinc-100 px-1">?reset=1</code>
        </p>
      </div>
    </div>
  );
}

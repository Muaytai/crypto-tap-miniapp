"use client";

import { useCallback, useEffect, useState } from "react";
import {
  POWERCXT_STAGES,
  loadStageIndex,
  resetStageProgress,
  saveStageIndex,
  POWERCXT_STORAGE_KEY,
} from "@/lib/powercxt-stages";
import {
  isPowercxtMuted,
  preloadPowercxtSamples,
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

export type ServerPlayerLite = { total_taps: number; coins: number } | null;

type Props = {
  reportTap: (n?: number) => void;
  serverPlayer: ServerPlayerLite;
  hasServerAuth: boolean;
  referralLink: string | null;
  onOpenTop: () => void;
  /** Вызов после последнего этапа — сразу отправить тапы на сервер (иначе ждём до 4 с). */
  onRunComplete?: () => void;
};

export function PowercxtGame({
  reportTap,
  serverPlayer,
  hasServerAuth,
  referralLink,
  onOpenTop,
  onRunComplete,
}: Props) {
  const [ready, setReady] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [sessionTaps, setSessionTaps] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(isPowercxtMuted());
    preloadPowercxtSamples();
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
      setSessionTaps(0);
    } else {
      setStageIndex(loadStageIndex());
    }
    setReady(true);
  }, []);

  const advance = useCallback(() => {
    setStageIndex((i) => {
      const next = i + 1;
      saveStageIndex(next);
      if (next >= POWERCXT_STAGES.length) {
        queueMicrotask(() => onRunComplete?.());
      }
      return next;
    });
  }, [onRunComplete]);

  const restartGame = useCallback(() => {
    resetStageProgress();
    setStageIndex(0);
    saveStageIndex(0);
    setSessionTaps(0);
  }, []);

  const wrapReportTap = useCallback(
    (n?: number) => {
      setSessionTaps((s) => s + (n ?? 1));
      reportTap(n);
    },
    [reportTap],
  );

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
    return (
      <PowercxtFinale
        onNewGame={restartGame}
        onOpenTop={onOpenTop}
        sessionTaps={sessionTaps}
        serverPlayer={serverPlayer}
        hasServerAuth={hasServerAuth}
        referralLink={referralLink}
      />
    );
  }

  const meta = POWERCXT_STAGES[stageIndex];

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-md flex-col gap-4 px-0 py-1 min-[400px]:gap-5 min-[400px]:px-1 sm:px-2">
      <header className="px-0.5 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400/90 min-[400px]:text-[11px] min-[400px]:tracking-[0.28em]">
          этап {stageIndex + 1} / {POWERCXT_STAGES.length}
        </p>
        <h2 className="mt-1.5 text-lg font-semibold leading-snug text-white min-[400px]:mt-2 min-[400px]:text-xl">
          {meta.title}
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-400 min-[400px]:mt-2 min-[400px]:text-sm">
          {meta.tagline}
        </p>
      </header>

      <div
        key={stageIndex}
        className="powercxt-stage-in w-full min-w-0 rounded-2xl border border-white/10 bg-zinc-900/50 p-3 shadow-[0_0_40px_rgba(0,0,0,0.35)] backdrop-blur-md min-[400px]:p-4 sm:p-5"
      >
        {stageIndex === 0 && (
          <StageTapRun target={52} onComplete={advance} reportTap={wrapReportTap} />
        )}
        {stageIndex === 1 && (
          <StageSprint
            durationMs={12000}
            minTaps={42}
            onComplete={advance}
            reportTap={wrapReportTap}
          />
        )}
        {stageIndex === 2 && (
          <StageHold
            holdsNeeded={3}
            holdMs={2200}
            onComplete={advance}
            reportTap={wrapReportTap}
          />
        )}
        {stageIndex === 3 && (
          <StageTiming
            hitsNeeded={5}
            greenMin={40}
            greenMax={60}
            onComplete={advance}
            reportTap={wrapReportTap}
          />
        )}
        {stageIndex === 4 && <StageMeter onComplete={advance} reportTap={wrapReportTap} />}
        {stageIndex === 5 && (
          <StageSwipe
            swipesNeeded={8}
            minDeltaY={72}
            onComplete={advance}
            reportTap={wrapReportTap}
          />
        )}
        {stageIndex === 6 && (
          <StageDoubleTap
            doublesNeeded={10}
            windowMs={320}
            onComplete={advance}
            reportTap={wrapReportTap}
          />
        )}
        {stageIndex === 7 && (
          <StageFinalBurst target={72} onComplete={advance} reportTap={wrapReportTap} />
        )}
      </div>

      <div className="flex w-full flex-col items-center px-1 pb-1">
        <button
          type="button"
          onClick={toggleMute}
          className="powercxt-tap-target inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl border border-violet-500/40 bg-gradient-to-r from-violet-950/80 to-zinc-900/90 px-4 py-3 text-xs font-semibold text-zinc-100 shadow-[0_0_28px_rgba(139,92,246,0.22)] transition hover:border-cyan-400/35 hover:shadow-[0_0_32px_rgba(34,211,238,0.12)] active:scale-[0.98] min-[400px]:px-5 min-[400px]:text-sm"
        >
          {muted ? (
            <>
              <svg
                className="h-5 w-5 shrink-0 text-violet-300"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M13 5L7 9H3v6h4l6 4V5z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 9l-6 6M16 9l6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span>Включить звук</span>
            </>
          ) : (
            <>
              <svg
                className="h-5 w-5 shrink-0 text-cyan-300"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M13 5L7 9H3v6h4l6 4V5z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M17.5 9.5a5 5 0 010 5M20 7a9 9 0 010 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span>Без звука</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

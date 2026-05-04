"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { syncTaps, type PlayerState } from "@/lib/api";
import { loadGameSettings } from "@/lib/gameSettings";

type Props = {
  initData: string;
  playerState: PlayerState | null;
  onSync: (
    newPlayer: PlayerState["player"],
    incomePerSecond: number,
    clickMultiplier?: number,
  ) => void;
};

export function SimpleTapGame({ initData, playerState, onSync }: Props) {
  const [localCoins, setLocalCoins] = useState(playerState?.player.coins || 0);
  const [incomePerSec, setIncomePerSec] = useState(playerState?.income_per_second || 0);
  const [clickMultiplier, setClickMultiplier] = useState(1);
  const [pendingTaps, setPendingTaps] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const lastSyncRef = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setClickMultiplier(1);
  }, [playerState]);

  useEffect(() => {
    if (playerState) {
      setLocalCoins(playerState.player.coins);
      setIncomePerSec(playerState.income_per_second);
    }
  }, [playerState]);

  useEffect(() => {
    if (incomePerSec === 0) return;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setLocalCoins((prev) => prev + incomePerSec);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [incomePerSec]);

  useEffect(() => {
    if (initData === "dev" || initData === "test_init_data") return;

    const syncInterval = setInterval(async () => {
      const now = Date.now();
      const secondsSince = (now - lastSyncRef.current) / 1000;
      const earnedCoins = Math.floor(secondsSince * incomePerSec);

      if (pendingTaps === 0 && earnedCoins === 0) return;

      try {
        const result = await syncTaps(initData, pendingTaps, earnedCoins);
        onSync(result.player, result.income_per_second, result.click_multiplier);
        setPendingTaps(0);
        setLocalCoins(result.player.coins);
        lastSyncRef.current = Date.now();
      } catch (error) {
        console.error("Sync failed:", error);
      }
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [initData, pendingTaps, incomePerSec, onSync]);

  const handleTap = useCallback(() => {
    setPendingTaps((prev) => prev + 1);
    setLocalCoins((prev) => prev + clickMultiplier);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 160);

    if (loadGameSettings().vibration) {
      const twa = (window as unknown as { Telegram?: { WebApp?: { HapticFeedback?: { impactOccurred: (s: string) => void } } } })
        .Telegram?.WebApp;
      twa?.HapticFeedback?.impactOccurred("light");
    }
  }, [clickMultiplier]);

  if (!playerState) {
    return <div className="flex justify-center p-8 text-zinc-500">Загрузка...</div>;
  }

  return (
    <div className="relative z-10 flex w-full max-w-md flex-col items-center px-3 pb-4 pt-1">
      {/* HUD как в референсе: валюта по центру, ниже — доход/сек */}
      <div className="mb-5 flex flex-col items-center text-center">
        <div className="flex items-baseline justify-center gap-2">
          <span
            className="text-2xl leading-none text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.75)]"
            aria-hidden
          >
            ◆
          </span>
          <p className="font-pixel text-3xl font-bold leading-none tracking-tight text-cyan-100 drop-shadow-[0_0_14px_rgba(34,211,238,0.45)] sm:text-4xl">
            {Math.floor(localCoins).toLocaleString("ru-RU")}
          </p>
        </div>
        <p className="font-pixel mt-2 text-sm text-cyan-400/95">
          +{incomePerSec} хеш/сек
        </p>
        <p className="font-pixel mt-1 text-[10px] uppercase tracking-wide text-amber-200/50">
          токены
        </p>
      </div>

      {/* Центральный тап: свечение «капли/монеты» */}
      <div className="relative flex h-[220px] w-[220px] items-center justify-center sm:h-[240px] sm:w-[240px]">
        <div
          className="pointer-events-none absolute inset-[-12%] rounded-full bg-cyan-400/15 blur-2xl animate-tap-glow"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          <span className="animate-float text-cyan-200/30 text-6xl blur-[1px]">✦</span>
        </div>
        <button
          type="button"
          onClick={handleTap}
          className={`tap-target animate-float relative flex h-full w-full items-center justify-center rounded-full border-4 border-cyan-300/55 bg-[radial-gradient(circle_at_32%_28%,#e0f2fe_0%,#38bdf8_18%,#0284c7_52%,#075985_100%)] shadow-[inset_0_-12px_28px_rgba(0,0,0,0.45),inset_0_8px_16px_rgba(255,255,255,0.35)] transition-transform active:scale-[0.96] ${
            isAnimating ? "scale-105" : ""
          } `}
        >
          <span className="relative select-none text-6xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] sm:text-7xl">
            ₿
          </span>
          {isAnimating && (
            <span className="font-pixel animate-ripple pointer-events-none absolute text-lg font-bold text-white/90">
              +{clickMultiplier}
            </span>
          )}
        </button>
      </div>

      {clickMultiplier > 1 && (
        <p className="font-pixel mt-3 text-xs text-violet-300">✨ x{clickMultiplier} за тап</p>
      )}

      {pendingTaps > 0 && initData !== "dev" && (
        <p className="font-pixel mt-2 text-[10px] text-amber-200/40">
          синхр… +{pendingTaps} тап
        </p>
      )}
    </div>
  );
}

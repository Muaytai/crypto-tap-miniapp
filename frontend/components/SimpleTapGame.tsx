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
  const [clickMultiplier, setClickMultiplier] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const pendingTapsRef = useRef(0);
  const lastSyncRef = useRef(Date.now());
  const isDev = initData === "dev" || initData === "test_init_data";

  // Обновляем множитель из улучшений
  useEffect(() => {
    if (!playerState) return;

    if (isDev) {
      // DEV-режим: ищем купленное улучшение типа click_multiplier
      const purchasedClickUpgrade = playerState.available_upgrades.find(
        u => u.upgrade_type === "click_multiplier" &&
        playerState.upgrades.some(pu => pu.upgrade_id === u.id)
      );
      if (purchasedClickUpgrade) {
        setClickMultiplier(purchasedClickUpgrade.value);
      } else {
        setClickMultiplier(1);
      }
    } else {
      // PROD-режим: множитель придёт с сервера через onSync
      setClickMultiplier(1);
    }
  }, [playerState, isDev]);

  // Периодическая синхронизация накопленных тапов с сервером
  useEffect(() => {
    if (isDev) return;
    if (!playerState) return;

    const syncInterval = setInterval(async () => {
      const tapsToSend = pendingTapsRef.current;
      if (tapsToSend === 0) return;

      try {
        const result = await syncTaps(initData, tapsToSend, 0);
        if (result.player) {
          onSync(result.player, result.income_per_second, result.click_multiplier);
          if (result.click_multiplier) {
            setClickMultiplier(result.click_multiplier);
          }
        }
        pendingTapsRef.current = 0;
        lastSyncRef.current = Date.now();
      } catch (error) {
        console.error("Sync failed:", error);
      }
    }, 5000); // синхронизируем каждые 5 секунд

    return () => clearInterval(syncInterval);
  }, [initData, onSync, isDev, playerState]);

  const handleTap = useCallback(() => {
    pendingTapsRef.current += 1;
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 160);

    // Мгновенно обновляем локальное отображение (оптимистичное обновление)
    if (playerState) {
      onSync(
        { ...playerState.player, coins: playerState.player.coins + clickMultiplier },
        playerState.income_per_second,
        clickMultiplier,
      );
    }

    if (loadGameSettings().vibration) {
      const twa = (window as unknown as { Telegram?: { WebApp?: { HapticFeedback?: { impactOccurred: (s: string) => void } } } })
        .Telegram?.WebApp;
      twa?.HapticFeedback?.impactOccurred("light");
    }
  }, [clickMultiplier, playerState, onSync]);

  if (!playerState) {
    return <div className="flex justify-center p-8 font-mono text-zinc-500">Загрузка...</div>;
  }

  return (
    <div className="relative z-10 flex w-full max-w-md flex-col items-center px-3 pb-4 pt-1">
      <div className="mb-5 flex flex-col items-center text-center">
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-2xl leading-none text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.75)]">
            ◆
          </span>
          <p className="font-mono text-3xl font-bold leading-none tracking-tight text-cyan-100 drop-shadow-[0_0_14px_rgba(34,211,238,0.45)] sm:text-4xl">
            {Math.floor(playerState.player.coins).toLocaleString("ru-RU")}
          </p>
        </div>
        <p className="font-mono mt-2 text-sm text-cyan-400/95">
          +{playerState.income_per_second} хеш/сек
        </p>
        <p className="font-mono mt-1 text-[10px] uppercase tracking-wide text-amber-200/50">
          токены
        </p>
      </div>

      <div className="relative flex h-[220px] w-[220px] items-center justify-center sm:h-[240px] sm:w-[240px]">
        <div className="pointer-events-none absolute inset-[-12%] rounded-full bg-cyan-400/15 blur-2xl animate-tap-glow" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="animate-float text-cyan-200/30 text-6xl blur-[1px]">✦</span>
        </div>
        <button
          type="button"
          onClick={handleTap}
          className={`tap-target animate-float relative flex h-full w-full items-center justify-center rounded-full border-4 border-cyan-300/55 bg-[radial-gradient(circle_at_32%_28%,#e0f2fe_0%,#38bdf8_18%,#0284c7_52%,#075985_100%)] shadow-[inset_0_-12px_28px_rgba(0,0,0,0.45),inset_0_8px_16px_rgba(255,255,255,0.35)] transition-transform active:scale-[0.96] ${
            isAnimating ? "scale-105" : ""
          }`}
        >
          <span className="relative select-none text-6xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] sm:text-7xl">
            ₿
          </span>
          {isAnimating && (
            <span className="font-mono animate-ripple pointer-events-none absolute text-lg font-bold text-white/90">
              +{clickMultiplier}
            </span>
          )}
        </button>
      </div>

      {clickMultiplier > 1 && (
        <p className="font-mono mt-3 text-xs text-violet-300">✨ x{clickMultiplier} за тап</p>
      )}

      {pendingTapsRef.current > 0 && !isDev && (
        <p className="font-mono mt-2 text-[10px] text-amber-200/40">
          синхр… +{pendingTapsRef.current} тап
        </p>
      )}
    </div>
  );
}
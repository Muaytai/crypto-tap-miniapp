"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { syncTaps, type PlayerState } from "@/lib/api";

type Props = {
  initData: string;
  playerState: PlayerState | null;
  onSync: (newPlayer: PlayerState["player"], incomePerSecond: number, clickMultiplier: number) => void;
};

export function SimpleTapGame({ initData, playerState, onSync }: Props) {
  const [localCoins, setLocalCoins] = useState(playerState?.player.coins || 0);
  const [incomePerSec, setIncomePerSec] = useState(playerState?.income_per_second || 0);
  const [clickMultiplier, setClickMultiplier] = useState(1);
  const [pendingTaps, setPendingTaps] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const lastSyncRef = useRef(Date.now());
  const localCoinsRef = useRef(localCoins);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Обновляем множитель кликов (пока заглушка, потом из улучшений)
  useEffect(() => {
    // TODO: получать из playerState.upgrades
    setClickMultiplier(1);
  }, [playerState]);

  // Обновляем состояние при изменении playerState
  useEffect(() => {
    if (playerState) {
      setLocalCoins(playerState.player.coins);
      setIncomePerSec(playerState.income_per_second);
      localCoinsRef.current = playerState.player.coins;
    }
  }, [playerState]);

  // Пассивный доход на клиенте (каждый тик прибавляем)
  useEffect(() => {
    if (incomePerSec === 0) return;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setLocalCoins(prev => {
        const newVal = prev + incomePerSec;
        localCoinsRef.current = newVal;
        return newVal;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [incomePerSec]);

  // Синхронизация с сервером (только для реального initData, не dev)
  useEffect(() => {
    // В dev-режиме не отправляем запросы на сервер
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
        localCoinsRef.current = result.player.coins;
        lastSyncRef.current = Date.now();
      } catch (error) {
        console.error("Sync failed:", error);
      }
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [initData, pendingTaps, incomePerSec, onSync]);

  const handleTap = useCallback(() => {
    setPendingTaps(prev => prev + 1);
    setLocalCoins(prev => prev + clickMultiplier);
    localCoinsRef.current = localCoinsRef.current + clickMultiplier;
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 200);

    // Haptic feedback (только если есть Telegram)
    const twa = (window as any).Telegram?.WebApp;
    if (twa?.HapticFeedback?.impactOccurred) {
      twa.HapticFeedback.impactOccurred("light");
    }
  }, [clickMultiplier]);

  if (!playerState) {
    return <div className="flex justify-center p-8 text-zinc-500">Загрузка...</div>;
  }

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-6">
      <div className="text-center">
        <p className="text-sm text-zinc-500">Монет</p>
        <p className="text-4xl font-bold text-cyan-400">
          {Math.floor(localCoins).toLocaleString("ru-RU")}
        </p>
        {incomePerSec > 0 && (
          <p className="text-xs text-zinc-500 mt-1">+{incomePerSec}/сек</p>
        )}
      </div>

      <button
        onClick={handleTap}
        className={`tap-target relative w-64 h-64 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-2xl transition-transform active:scale-95 ${
          isAnimating ? "scale-105" : ""
        }`}
      >
        <span className="absolute inset-0 flex items-center justify-center text-6xl">💧</span>
        {isAnimating && (
          <span className="absolute inset-0 flex items-center justify-center text-4xl animate-ripple">
            +{clickMultiplier}
          </span>
        )}
      </button>

      {clickMultiplier > 1 && (
        <p className="text-sm text-violet-400">✨ x{clickMultiplier} за тап</p>
      )}

      {pendingTaps > 0 && initData !== "dev" && (
        <p className="text-xs text-zinc-600">Синхронизация... +{pendingTaps} тапов</p>
      )}
    </div>
  );
}
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

// Пороги для смены кнопки
const BUTTON_LEVELS = [
  { threshold: 0, level: 1, image: "/images/buttons/button_1.png" },
  { threshold: 100, level: 2, image: "/images/buttons/button_2.png" },
  { threshold: 1000, level: 3, image: "/images/buttons/button_3.png" },
  { threshold: 10000, level: 4, image: "/images/buttons/button_4.png" },
  { threshold: 100000, level: 5, image: "/images/buttons/button_5.png" },
  { threshold: 1000000, level: 6, image: "/images/buttons/button_6.png" },
  { threshold: 10000000, level: 7, image: "/images/buttons/button_7.png" },
  { threshold: 100000000, level: 8, image: "/images/buttons/button_8.png" },
  { threshold: 1000000000, level: 9, image: "/images/buttons/button_9.png" },
  { threshold: 10000000000, level: 10, image: "/images/buttons/button_10.png" },
];

export function SimpleTapGame({ initData, playerState, onSync }: Props) {
  const [clickMultiplier, setClickMultiplier] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [buttonImage, setButtonImage] = useState("/images/buttons/button_1.png");
  const [imgError, setImgError] = useState(false);
  const pendingTapsRef = useRef(0);
  const lastSyncRef = useRef(Date.now());
  const isDev = initData === "dev" || initData === "test_init_data";

  // Функция получения картинки по доходу
  const getButtonImageByIncome = useCallback((income: number): string => {
    for (let i = BUTTON_LEVELS.length - 1; i >= 0; i--) {
      if (income >= BUTTON_LEVELS[i].threshold) {
        return BUTTON_LEVELS[i].image;
      }
    }
    return "/images/buttons/button_1.png";
  }, []);

  // Обновляем картинку кнопки при изменении дохода
  useEffect(() => {
    if (!playerState) return;
    const newImage = getButtonImageByIncome(playerState.income_per_second);
    setButtonImage(newImage);
    setImgError(false);
  }, [playerState?.income_per_second, getButtonImageByIncome]);

  // Обновляем множитель из улучшений
  useEffect(() => {
    if (!playerState) return;

    if (isDev) {
      const purchasedClickUpgrade = playerState.available_upgrades.find(
        u => u.upgrade_type === "click_multiplier" &&
        playerState.upgrades.some(pu => pu.upgrade_id === u.id)
      );
      setClickMultiplier(purchasedClickUpgrade?.value || 1);
    } else {
      setClickMultiplier(1);
    }
  }, [playerState, isDev]);

  // Периодическая синхронизация
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
    }, 5000);

    return () => clearInterval(syncInterval);
  }, [initData, onSync, isDev, playerState]);

  const handleTap = useCallback(() => {
    pendingTapsRef.current += 1;
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 160);

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

  const baseIcon = "🪙";

  return (
    <div className="flex h-full w-full flex-col items-center px-3 pb-6 pt-1">
      {/* HUD сверху */}
      <div className="flex flex-col items-center text-center">
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
        <p className="font-mono mt-1 text-[10px] uppercase tracking-wide text-white/40">
          токены
        </p>
      </div>

      <div className="flex-1" />

      {/* Кнопка тапа */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="absolute inset-[-20%] rounded-full bg-cyan-400/10 blur-2xl animate-tap-glow" />
          <button
            type="button"
            onClick={handleTap}
            className={`tap-target relative flex h-28 w-28 items-center justify-center rounded-full transition-transform active:scale-95 ${
              isAnimating ? "scale-105" : ""
            }`}
          >
            {!imgError && buttonImage ? (
              <img
                src={buttonImage}
                alt="Tap"
                className="h-full w-full object-contain"
                onError={() => {
                  setImgError(true);
                  setButtonImage("/images/buttons/button_1.png");
                }}
              />
            ) : (
              <span className="text-6xl">{baseIcon}</span>
            )}
            {isAnimating && (
              <span className="font-mono animate-ripple pointer-events-none absolute text-lg font-bold text-white/90">
                +{clickMultiplier}
              </span>
            )}
          </button>
        </div>

        {clickMultiplier > 1 && (
          <p className="font-mono mt-2 text-xs text-violet-300">✨ x{clickMultiplier} за тап</p>
        )}

        {pendingTapsRef.current > 0 && !isDev && (
          <p className="font-mono mt-1 text-[10px] text-white/30">
            синхр… +{pendingTapsRef.current} тап
          </p>
        )}
      </div>
    </div>
  );
}
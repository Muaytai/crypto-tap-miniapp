"use client";

import { useState, useEffect, useMemo } from "react";
import { buyUpgrade, type PlayerState } from "@/lib/api";
import { upgradeImageUrl } from "@/lib/upgradeIcons";
import {
  applyDevUpgradePurchase,
  getUnlockProgress,
  getUpgradeEffectBadge,
  sortUpgrades,
  type UpgradeRow,
} from "@/lib/upgradeEffects";
import { playGameSound } from "@/lib/gameSounds";

type Props = {
  initData: string;
  playerState: PlayerState;
  onPurchase: (newState: PlayerState) => void;
};

const formatPrice = (num: number): string => {
  if (num < 1000) return num.toLocaleString("ru-RU");

  const units = ["", "K", "M", "B", "T", "Qa", "Qi"];
  let value = num;
  let unitIndex = 0;

  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex++;
  }

  const formatted = value >= 100
    ? Math.floor(value).toString()
    : value.toFixed(1).replace(/\.0$/, "");

  return `${formatted}${units[unitIndex]}`;
};

export function UpgradesPanel({ initData, playerState, onPurchase }: Props) {
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentPurchase, setRecentPurchase] = useState<number | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  const isDev = initData === "dev" || initData === "test_init_data";
  const purchasedUpgradeIds = useMemo(
    () => new Set(playerState.upgrades.map((u) => u.upgrade_id)),
    [playerState.upgrades],
  );

  const sortedUpgrades = useMemo(
    () => sortUpgrades(playerState.available_upgrades, purchasedUpgradeIds),
    [playerState.available_upgrades, purchasedUpgradeIds],
  );

  const handleBuy = async (upgradeId: number) => {
    setLoading(upgradeId);
    setError(null);

    const upgrade = playerState.available_upgrades.find((u) => u.id === upgradeId);
    if (!upgrade) {
      setError("Улучшение не найдено");
      playGameSound("error");
      setLoading(null);
      return;
    }

    if (purchasedUpgradeIds.has(upgradeId)) {
      setError("Уже куплено");
      playGameSound("error");
      setLoading(null);
      return;
    }

    if (!isUnlocked(upgrade)) {
      setError(getLockReason(upgrade));
      playGameSound("error");
      setLoading(null);
      return;
    }

    if (playerState.player.coins < upgrade.base_price) {
      setError(`Не хватает монет! Нужно ${formatPrice(upgrade.base_price)}`);
      playGameSound("error");
      setLoading(null);
      return;
    }

    if (isDev) {
      setTimeout(() => {
        onPurchase(applyDevUpgradePurchase(playerState, upgrade));
        setRecentPurchase(upgradeId);
        playGameSound("success");
        setLoading(null);
      }, 300);
      return;
    }

    try {
      const result = await buyUpgrade(initData, upgradeId);
      if (result.success) {
        onPurchase({
          ...playerState,
          player: {
            ...playerState.player,
            coins: result.coins_left,
            max_offline_minutes: result.max_offline_minutes ?? playerState.player.max_offline_minutes,
          },
          income_per_second: result.cached_income_per_second ?? playerState.income_per_second,
          upgrades: [
            ...playerState.upgrades,
            {
              upgrade_id: upgradeId,
              upgrade_name: result.upgrade_name || upgrade.name,
              upgrade_icon: upgrade.icon_name || "",
            },
          ],
        });
        setRecentPurchase(upgradeId);
        playGameSound("success");
      } else {
        setError(result.error || "Ошибка покупки");
        playGameSound("error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка покупки");
      playGameSound("error");
    } finally {
      setLoading(null);
    }
  };

  useEffect(() => {
    if (recentPurchase) {
      const timer = setTimeout(() => setRecentPurchase(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [recentPurchase]);

  const isUnlocked = (upgrade: UpgradeRow): boolean => {
    if (upgrade.min_total_taps > 0 && playerState.player.total_taps < upgrade.min_total_taps) {
      return false;
    }
    return true;
  };

  const getLockReason = (upgrade: UpgradeRow): string => {
    if (upgrade.min_total_taps > 0 && playerState.player.total_taps < upgrade.min_total_taps) {
      return `🔒 Нужно ${upgrade.min_total_taps.toLocaleString("ru-RU")} тапов`;
    }
    return "🔒 Недоступно";
  };

  const getUpgradeDescription = (upgrade: UpgradeRow): string => {
    if (upgrade.description?.trim()) {
      return upgrade.description.trim();
    }
    switch (upgrade.upgrade_type) {
      case "click_multiplier":
        return `Каждый тап приносит в ${upgrade.value} раза больше осколков`;
      case "income_multiplier":
        return `Пассивный доход увеличивается в ${upgrade.value} раза`;
      case "offline_extension":
        return `Оффлайн-накопление ещё на ${upgrade.value} мин`;
      default:
        return upgrade.name;
    }
  };

  const getUpgradeIcon = (upgrade: UpgradeRow): string => {
    if (upgrade.icon_name?.trim()) return upgrade.icon_name.trim();
    switch (upgrade.upgrade_type) {
      case "click_multiplier":
        return "👆";
      case "income_multiplier":
        return "⚡";
      case "offline_extension":
        return "😴";
      default:
        return "✨";
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#0a0806] px-4 pb-6">
      <div className="border-b border-violet-500/10 pb-4 pt-5">
        <h1 className="font-pixel text-center text-3xl font-bold tracking-[0.15em] text-violet-400 drop-shadow-[0_0_15px_#a855f7]">
          АПГРЕЙДЫ
        </h1>
        <p className="mt-1 text-center font-mono text-xs text-violet-500/60">Улучшай • Ускоряй • Доминируй</p>
      </div>

      {isDev && (
        <div className="mt-4 rounded-2xl border border-violet-400/30 bg-violet-950/30 p-3 text-center text-xs text-violet-400 backdrop-blur-md">
          ⚡ DEV MODE — локальные покупки
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-950/50 p-3 text-center text-sm text-red-200 backdrop-blur-md">
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {sortedUpgrades.map((upgrade) => {
          const isPurchased = purchasedUpgradeIds.has(upgrade.id);
          const unlocked = isUnlocked(upgrade);
          const canBuy = !isPurchased && unlocked && playerState.player.coins >= upgrade.base_price;
          const isRecent = recentPurchase === upgrade.id;
          const imageUrl = upgradeImageUrl(upgrade);
          const hasImgError = imgErrors[upgrade.id];
          const effect = getUpgradeEffectBadge(upgrade);
          const unlockProgress = getUnlockProgress(upgrade, playerState.player.total_taps);

          return (
            <div
              key={upgrade.id}
              className={`group relative overflow-hidden rounded-3xl border p-5 transition-all duration-300 backdrop-blur-xl ${
                isPurchased
                  ? "border-green-500/40 bg-green-950/20"
                  : isRecent
                  ? "border-violet-400 shadow-2xl shadow-violet-500/50 scale-[1.02]"
                  : !unlocked
                  ? "border-white/10 bg-zinc-950/60 opacity-75"
                  : "border-white/10 bg-zinc-950/80 hover:border-violet-400/40 hover:shadow-2xl hover:shadow-violet-500/10"
              }`}
            >
              {isRecent && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="animate-floatUp text-2xl font-bold text-violet-400 drop-shadow-[0_0_12px_#c026d3]">
                    ✓ УЛУЧШЕНО
                  </div>
                </div>
              )}

              <div className="flex gap-5">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-violet-500/20 bg-zinc-900/80 p-1.5">
                  {!hasImgError ? (
                    <img
                      src={imageUrl}
                      alt={upgrade.name}
                      className={[
                        "h-full w-full object-contain transition-all",
                        isPurchased
                          ? "drop-shadow-[0_0_10px_rgba(34,197,94,0.35)]"
                          : unlocked
                            ? "opacity-95"
                            : "opacity-60 grayscale-[0.4]",
                      ].join(" ")}
                      onError={() => setImgErrors((prev) => ({ ...prev, [upgrade.id]: true }))}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl">
                      {getUpgradeIcon(upgrade)}
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-pixel text-xl font-bold text-white tracking-wide">{upgrade.name}</h3>
                      <span
                        className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wide ${effect.className}`}
                      >
                        {effect.label}
                      </span>
                    </div>
                    <p className="mt-1 text-violet-300/90 font-mono text-sm leading-snug">
                      {getUpgradeDescription(upgrade)}
                    </p>
                    {unlockProgress && (
                      <div className="mt-2">
                        <div className="flex justify-between font-mono text-[10px] text-rose-400/90">
                          <span>Тапы для разблокировки</span>
                          <span>
                            {unlockProgress.current.toLocaleString("ru-RU")} /{" "}
                            {unlockProgress.target.toLocaleString("ru-RU")}
                          </span>
                        </div>
                        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-zinc-900">
                          <div
                            className="h-full bg-gradient-to-r from-rose-500 to-violet-500 transition-all"
                            style={{ width: `${unlockProgress.pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    {!isPurchased && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xl text-violet-400">₿</span>
                        <span className="font-mono text-2xl font-semibold text-violet-300 tabular-nums tracking-tight">
                          {formatPrice(upgrade.base_price)}
                        </span>
                      </div>
                    )}

                    {isPurchased ? (
                      <div className="w-full py-3.5 text-center font-pixel text-sm font-bold text-green-400 border border-green-500/30 rounded-2xl">
                        ✓ КУПЛЕНО
                      </div>
                    ) : (
                      <button
                        onClick={() => handleBuy(upgrade.id)}
                        disabled={loading === upgrade.id}
                        className={`tap-target w-full py-3.5 rounded-2xl font-pixel text-sm font-bold transition-all duration-200 shadow-lg ${
                          canBuy
                            ? "bg-gradient-to-b from-violet-500 to-violet-700 text-white hover:brightness-110 active:scale-[0.97] shadow-violet-500/50"
                            : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700/80"
                        }`}
                      >
                        {loading === upgrade.id ? "..." : canBuy ? "КУПИТЬ" : "НЕДОСТУПНО"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {playerState.available_upgrades.length === 0 && (
        <p className="py-20 text-center font-mono text-xs text-zinc-500">Пока нет доступных улучшений</p>
      )}
    </div>
  );
}

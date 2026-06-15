"use client";

import { useState, useEffect } from "react";
import { buyUpgrade, type PlayerState } from "@/lib/api";
import { ItemShop } from "@/components/ItemShop";

type Props = {
  initData: string;
  playerState: PlayerState;
  onPurchase: (newState: PlayerState) => void;
};

// Форматирование больших чисел
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

  const isDev = initData === "dev" || initData === "test_init_data";
  const purchasedUpgradeIds = new Set(playerState.upgrades.map(u => u.upgrade_id));

  const handleBuy = async (upgradeId: number) => {
    setLoading(upgradeId);
    setError(null);

    const upgrade = playerState.available_upgrades.find(u => u.id === upgradeId);
    if (!upgrade) {
      setError("Улучшение не найдено");
      setLoading(null);
      return;
    }

    if (purchasedUpgradeIds.has(upgradeId)) {
      setError("Уже куплено");
      setLoading(null);
      return;
    }

    if (playerState.player.coins < upgrade.base_price) {
      setError(`Не хватает монет! Нужно ${formatPrice(upgrade.base_price)}`);
      setLoading(null);
      return;
    }

    if (isDev) {
      setTimeout(() => {
        const updatedState = {
          ...playerState,
          player: {
            ...playerState.player,
            coins: playerState.player.coins - upgrade.base_price,
          },
          upgrades: [
            ...playerState.upgrades,
            {
              upgrade_id: upgradeId,
              upgrade_name: upgrade.name,
              upgrade_icon: upgrade.icon_name || ""
            },
          ],
        };
        onPurchase(updatedState);
        setRecentPurchase(upgradeId);
        setLoading(null);
      }, 300);
      return;
    }

    // Реальный API-запрос
    try {
      const result = await buyUpgrade(initData, upgradeId);
      if (result.success) {
        const updatedState = {
          ...playerState,
          player: { ...playerState.player, coins: result.coins_left },
          upgrades: [
            ...playerState.upgrades,
            {
              upgrade_id: upgradeId,
              upgrade_name: result.upgrade_name || upgrade.name,
              upgrade_icon: ""
            },
          ],
        };
        onPurchase(updatedState);
        setRecentPurchase(upgradeId);
      } else {
        setError(result.error || "Ошибка покупки");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка покупки");
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

  const isUnlocked = (upgrade: PlayerState["available_upgrades"][0]): boolean => {
    if (upgrade.min_total_taps > 0 && playerState.player.total_taps < upgrade.min_total_taps) {
      return false;
    }
    return true;
  };

  const getLockReason = (upgrade: PlayerState["available_upgrades"][0]): string => {
    if (upgrade.min_total_taps > 0 && playerState.player.total_taps < upgrade.min_total_taps) {
      return `🔒 Нужно ${upgrade.min_total_taps.toLocaleString("ru-RU")} тапов`;
    }
    return "🔒 Недоступно";
  };

  const getUpgradeDescription = (upgrade: PlayerState["available_upgrades"][0]): string => {
    switch (upgrade.upgrade_type) {
      case "click_multiplier":
        return `Тап ×${upgrade.value}`;
      case "income_multiplier":
        return `Доход ×${upgrade.value}`;
      case "offline_extension":
        return `Оффлайн +${upgrade.value} мин`;
      default:
        return upgrade.name;
    }
  };

  const getUpgradeIcon = (type: string): string => {
    switch (type) {
      case "click_multiplier": return "👆";
      case "income_multiplier": return "⚡";
      case "offline_extension": return "🌙";
      default: return "✨";
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
        {playerState.available_upgrades.map((upgrade) => {
          const isPurchased = purchasedUpgradeIds.has(upgrade.id);
          const unlocked = isUnlocked(upgrade);
          const canBuy = !isPurchased && unlocked && playerState.player.coins >= upgrade.base_price;
          const isRecent = recentPurchase === upgrade.id;

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
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-violet-500/20 bg-zinc-900/80 text-4xl">
                  {getUpgradeIcon(upgrade.upgrade_type)}
                </div>

                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-pixel text-xl font-bold text-white tracking-wide">{upgrade.name}</h3>
                    <p className="mt-1 text-violet-300 font-mono text-sm">
                      {getUpgradeDescription(upgrade)}
                    </p>
                    {!unlocked && (
                      <p className="mt-1 text-xs text-rose-400 font-mono">
                        {getLockReason(upgrade)}
                      </p>
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
                        disabled={loading === upgrade.id || !canBuy}
                        className={`tap-target w-full py-3.5 rounded-2xl font-pixel text-sm font-bold transition-all duration-200 shadow-lg ${
                          canBuy
                            ? "bg-gradient-to-b from-violet-500 to-violet-700 text-white hover:brightness-110 active:scale-[0.97] shadow-violet-500/50"
                            : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        }`}
                      >
                        {loading === upgrade.id ? "..." : "КУПИТЬ"}
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
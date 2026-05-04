"use client";

import { useState } from "react";
import { buyUpgrade, type PlayerState } from "@/lib/api";

type Props = {
  initData: string;
  playerState: PlayerState;
  onPurchase: (newState: PlayerState) => void;
};

export function UpgradesPanel({ initData, playerState, onPurchase }: Props) {
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const purchasedUpgradeIds = new Set(playerState.upgrades.map(u => u.upgrade_id));

  const handleBuy = async (upgradeId: number) => {
    setLoading(upgradeId);
    setError(null);
    try {
      const result = await buyUpgrade(initData, upgradeId);
      if (result.success) {
        const updatedState = {
          ...playerState,
          player: {
            ...playerState.player,
            coins: result.coins_left,
          },
          upgrades: [
            ...playerState.upgrades,
            { upgrade_id: upgradeId, upgrade_name: result.upgrade_name },
          ],
        };
        onPurchase(updatedState);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка покупки");
    } finally {
      setLoading(null);
    }
  };

  const isUnlocked = (upgrade: PlayerState["available_upgrades"][0]): boolean => {
    if (upgrade.min_total_taps > 0 && playerState.player.total_taps < upgrade.min_total_taps) {
      return false;
    }
    return true;
  };

  const getLockReason = (upgrade: PlayerState["available_upgrades"][0]): string => {
    if (upgrade.min_total_taps > 0 && playerState.player.total_taps < upgrade.min_total_taps) {
      return `🔒 Требуется ${upgrade.min_total_taps.toLocaleString("ru-RU")} тапов`;
    }
    return "🔒 Недоступно";
  };

  const getUpgradeIcon = (type: string): string => {
    switch (type) {
      case "click_multiplier": return "👆";
      case "income_multiplier": return "⚡";
      case "offline_extension": return "😴";
      default: return "✨";
    }
  };

  const getUpgradeDescription = (upgrade: PlayerState["available_upgrades"][0]): string => {
    switch (upgrade.upgrade_type) {
      case "click_multiplier":
        return `Тап даёт x${upgrade.value} монет`;
      case "income_multiplier":
        return `Пассивный доход x${upgrade.value}`;
      case "offline_extension":
        return `Оффлайн лимит +${upgrade.value} мин`;
      default:
        return upgrade.upgrade_type;
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Улучшения</h2>
        <div className="rounded-full bg-cyan-500/20 px-3 py-1 text-sm text-cyan-400">
          💰 {playerState.player.coins.toLocaleString("ru-RU")}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/20 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {playerState.available_upgrades.map((upgrade) => {
          const isPurchased = purchasedUpgradeIds.has(upgrade.id);
          const unlocked = isUnlocked(upgrade);
          const canAfford = playerState.player.coins >= upgrade.base_price;
          const canBuy = !isPurchased && unlocked && canAfford;

          return (
            <div
              key={upgrade.id}
              className={`rounded-2xl border p-4 transition ${
                isPurchased
                  ? "border-green-500/30 bg-green-950/20"
                  : unlocked
                  ? "border-white/10 bg-white/5 hover:border-cyan-500/30"
                  : "border-white/5 bg-white/5 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getUpgradeIcon(upgrade.upgrade_type)}</span>
                    <div>
                      <h3 className="text-lg font-medium text-white">{upgrade.name}</h3>
                      <p className="text-xs text-zinc-500">
                        {getUpgradeDescription(upgrade)}
                      </p>
                    </div>
                  </div>
                  {!unlocked && (
                    <p className="mt-2 text-xs text-amber-400">
                      {getLockReason(upgrade)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {isPurchased ? (
                    <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400">
                      ✓ Куплено
                    </span>
                  ) : (
                    <button
                      onClick={() => handleBuy(upgrade.id)}
                      disabled={loading === upgrade.id || !canBuy}
                      className={`tap-target rounded-xl px-4 py-2 text-sm font-medium transition ${
                        canBuy
                          ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:scale-105"
                          : "bg-zinc-700 text-zinc-500"
                      }`}
                    >
                      {loading === upgrade.id
                        ? "..."
                        : `${upgrade.base_price.toLocaleString("ru-RU")} 💰`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {playerState.available_upgrades.length === 0 && (
        <p className="py-8 text-center text-zinc-500">
          Пока нет доступных улучшений
        </p>
      )}
    </div>
  );
}
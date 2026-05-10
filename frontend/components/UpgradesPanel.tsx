"use client";

import { useState } from "react";
import { buyUpgrade, type PlayerState } from "@/lib/api";
import { ItemShop } from "@/components/ItemShop";

type Props = {
  initData: string;
  playerState: PlayerState;
  onPurchase: (newState: PlayerState) => void;
};

export function UpgradesPanel({ initData, playerState, onPurchase }: Props) {
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDev = initData === "dev" || initData === "test_init_data";
  const purchasedUpgradeIds = new Set(playerState.upgrades.map(u => u.upgrade_id));

  const handleBuy = async (upgradeId: number) => {
    setLoading(upgradeId);
    setError(null);

    // DEV-режим: имитируем покупку локально
    if (isDev) {
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
        setError(`Не хватает монет! Нужно ${upgrade.base_price.toLocaleString("ru-RU")}`);
        setLoading(null);
        return;
      }

      // Имитируем успешную покупку
      setTimeout(() => {
        const updatedState = {
          ...playerState,
          player: {
            ...playerState.player,
            coins: playerState.player.coins - upgrade.base_price,
          },
          upgrades: [
            ...playerState.upgrades,
            { upgrade_id: upgradeId, upgrade_name: upgrade.name, upgrade_icon: upgrade.icon_name || "" },
          ],
        };
        onPurchase(updatedState);
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
          player: {
            ...playerState.player,
            coins: result.coins_left,
          },
          upgrades: [
            ...playerState.upgrades,
            { upgrade_id: upgradeId, upgrade_name: result.upgrade_name, upgrade_icon: "" },
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

  const getUpgradeIcon = (type: string): string => {
    switch (type) {
      case "click_multiplier": return "👆";
      case "income_multiplier": return "⚡";
      case "offline_extension": return "😴";
      default: return "✨";
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-[#0f0c0a] to-[#1a1510] px-3 pb-6">
      <div className="border-b-2 border-amber-600/30 py-4 text-center">
        <h1 className="font-mono text-2xl font-bold uppercase tracking-[0.15em] text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
          АПГРЕЙДЫ
        </h1>
      </div>

      {isDev && (
        <div className="mt-2 text-center font-mono text-[10px] text-amber-600/60">
          ⚡ DEV-режим: покупки локально
        </div>
      )}

      {error && (
        <div className="mt-3 border-2 border-red-700/50 bg-red-950/40 p-2 font-mono text-[10px] text-red-200 text-center">
          {error}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {playerState.available_upgrades.map((upgrade) => {
          const isPurchased = purchasedUpgradeIds.has(upgrade.id);
          const unlocked = isUnlocked(upgrade);
          const canBuy = !isPurchased && unlocked && playerState.player.coins >= upgrade.base_price;

          return (
            <div
              key={upgrade.id}
              className={`group rounded-xl border p-3 transition-all ${
                isPurchased
                  ? "border-green-500/30 bg-green-950/20 opacity-60"
                  : !unlocked
                  ? "border-amber-800/20 bg-white/5 opacity-50"
                  : "border-amber-700/30 bg-white/5 hover:border-amber-500/50 hover:bg-white/10 hover:-translate-y-0.5"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getUpgradeIcon(upgrade.upgrade_type)}</span>
                    <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-amber-50">
                      {upgrade.name}
                    </h3>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-emerald-400/80">
                    {getUpgradeDescription(upgrade)}
                  </p>
                  {!unlocked && (
                    <p className="mt-1 font-mono text-[9px] text-amber-600">
                      {getLockReason(upgrade)}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 min-w-[90px]">
                  {!isPurchased && (
                    <div className="flex items-center gap-1 font-mono text-xs text-amber-500">
                      <span className="text-sm">⏱️</span>
                      <span className="font-bold">{upgrade.base_price.toLocaleString("ru-RU")}</span>
                    </div>
                  )}
                  {isPurchased ? (
                    <span className="font-mono text-[10px] text-green-500">✓ куплено</span>
                  ) : (
                    <button
                      onClick={() => handleBuy(upgrade.id)}
                      disabled={loading === upgrade.id || !canBuy}
                      className={`font-mono text-[11px] px-3 py-1.5 rounded-md transition-all ${
                        canBuy
                          ? "bg-gradient-to-b from-amber-600 to-orange-700 text-white shadow-md hover:scale-105 active:scale-95"
                          : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      }`}
                    >
                      {loading === upgrade.id ? "..." : "Купить"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {playerState.available_upgrades.length === 0 && (
        <p className="mt-8 text-center font-mono text-xs text-zinc-500">
          Пока нет доступных улучшений
        </p>
      )}
    </div>
  );
}
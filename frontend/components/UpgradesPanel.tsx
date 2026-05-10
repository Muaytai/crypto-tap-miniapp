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
            { upgrade_id: upgradeId, upgrade_name: upgrade.name },
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
    <div className="flex flex-col gap-3 px-3 pb-4">
      <div className="mb-1 border-b-2 border-amber-800/40 pb-1.5">
        <h2 className="font-pixel text-sm font-bold uppercase tracking-wide text-amber-100">
          АПГРЕЙДЫ
        </h2>
      </div>

      {error && (
        <div className="border-2 border-red-700/50 bg-red-950/40 p-2 font-pixel text-[10px] text-red-200 text-center">
          {error}
        </div>
      )}

      {isDev && (
        <div className="border-2 border-amber-700/50 bg-amber-950/40 p-2 font-pixel text-[10px] text-amber-300 text-center">
          ⚡ DEV-режим: покупки работают локально без сервера
        </div>
      )}

      <div className="flex flex-col gap-3">
        {playerState.available_upgrades.map((upgrade) => {
          const isPurchased = purchasedUpgradeIds.has(upgrade.id);
          const unlocked = isUnlocked(upgrade);
          const canBuy = !isPurchased && unlocked && playerState.player.coins >= upgrade.base_price;

          return (
            <div
              key={upgrade.id}
              className={`border-b border-amber-800/25 py-3 last:border-b-0 ${
                isPurchased ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-pixel text-sm text-amber-50">{upgrade.name}</h3>
                  <p className="font-pixel text-[10px] leading-relaxed text-cyan-400/80">
                    {getUpgradeDescription(upgrade)}
                  </p>
                  {!unlocked && (
                    <p className="mt-1 font-pixel text-[9px] text-amber-600">
                      {getLockReason(upgrade)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {isPurchased ? (
                    <span className="font-pixel text-[10px] text-green-500">✓ куплено</span>
                  ) : (
                    <button
                      onClick={() => handleBuy(upgrade.id)}
                      disabled={loading === upgrade.id || !canBuy}
                      className={`tap-target font-pixel border px-3 py-1.5 text-[10px] transition ${
                        canBuy
                          ? "border-cyan-500/60 bg-gradient-to-b from-cyan-700 to-blue-800 text-white active:translate-y-px"
                          : "cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-600"
                      }`}
                    >
                      {loading === upgrade.id
                        ? "..."
                        : `${upgrade.base_price.toLocaleString("ru-RU")}`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {playerState.available_upgrades.length === 0 && (
        <p className="py-8 text-center font-pixel text-xs text-zinc-500">
          Пока нет доступных улучшений
        </p>
      )}
    </div>
  );
}
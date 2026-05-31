"use client";

import { useState } from "react";
import { buyUpgrade, type PlayerState } from "@/lib/api";

type Props = {
  initData: string;
  playerState: PlayerState;
  onPurchase: (newState: PlayerState) => void;
};

type UpgradeRow = PlayerState["available_upgrades"][0];

/** Эффекты покупки в dev (аналог пересчёта на бэкенде после /api/upgrades/buy/). */
function applyDevUpgradeEffect(
  state: PlayerState,
  upgrade: UpgradeRow,
): PlayerState {
  let income = state.income_per_second;
  let maxOffline = state.player.max_offline_minutes;

  if (upgrade.upgrade_type === "income_multiplier") {
    income = Math.floor(income * upgrade.value);
  } else if (upgrade.upgrade_type === "offline_extension") {
    maxOffline += Math.floor(upgrade.value);
  }

  return {
    ...state,
    income_per_second: income,
    player: { ...state.player, max_offline_minutes: maxOffline },
  };
}

export function UpgradesPanel({ initData, playerState, onPurchase }: Props) {
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDev = initData === "dev" || initData === "test_init_data";
  const purchasedUpgradeIds = new Set(playerState.upgrades.map((u) => u.upgrade_id));

  const handleBuy = async (upgradeId: number) => {
    setLoading(upgradeId);
    setError(null);

    // DEV-режим: имитируем покупку локально
    if (isDev) {
      const upgrade = playerState.available_upgrades.find((u) => u.id === upgradeId);
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
        let next: PlayerState = {
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
              upgrade_icon: upgrade.icon_name ?? "",
            },
          ],
        };
        next = applyDevUpgradeEffect(next, upgrade);
        onPurchase(next);
        setLoading(null);
      }, 300);
      return;
    }

    // Реальный API-запрос
    try {
      const catalogUpgrade = playerState.available_upgrades.find((u) => u.id === upgradeId);
      const result = await buyUpgrade(initData, upgradeId);
      if (result.success) {
        onPurchase({
          ...playerState,
          player: {
            ...playerState.player,
            coins: result.coins_left,
            max_offline_minutes:
              result.max_offline_minutes ?? playerState.player.max_offline_minutes,
          },
          income_per_second:
            result.cached_income_per_second ?? playerState.income_per_second,
          upgrades: [
            ...playerState.upgrades,
            {
              upgrade_id: upgradeId,
              upgrade_name: result.upgrade_name,
              upgrade_icon: catalogUpgrade?.icon_name ?? "",
            },
          ],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка покупки");
    } finally {
      setLoading(null);
    }
  };

  const isUnlocked = (upgrade: UpgradeRow): boolean => {
    if (upgrade.min_total_taps > 0 && playerState.player.total_taps < upgrade.min_total_taps) {
      return false;
    }
    return true;
  };

  const getLockReason = (upgrade: UpgradeRow): string => {
    if (upgrade.min_total_taps > 0 && playerState.player.total_taps < upgrade.min_total_taps) {
      return `🔒 Требуется ${upgrade.min_total_taps.toLocaleString("ru-RU")} тапов`;
    }
    return "🔒 Недоступно";
  };

  const getUpgradeDescription = (upgrade: UpgradeRow): string => {
    if (upgrade.description?.trim()) {
      return upgrade.description.trim();
    }
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
    <div className="flex min-h-full flex-col gap-4 bg-[#0f0c0a] px-4 pb-6">
      <div className="border-b-2 border-violet-400/30 pb-2 pt-4 text-center">
        <h1 className="font-pixel text-2xl font-bold tracking-[0.2em] text-violet-500 drop-shadow-[0_0_8px_#8b5cf6]">
          УЛУЧШЕНИЯ
        </h1>
      </div>

      {error && (
        <div className="rounded border-2 border-red-700/50 bg-red-950/40 p-2 text-center font-pixel text-[10px] text-red-200">
          {error}
        </div>
      )}

      {isDev && (
        <div className="rounded border-2 border-violet-700/50 bg-violet-950/40 p-2 text-center font-pixel text-[10px] text-violet-300">
          ⚡ DEV-режим: покупки работают локально
        </div>
      )}

      <div className="flex flex-col gap-4">
        {playerState.available_upgrades.map((upgrade) => {
          const isPurchased = purchasedUpgradeIds.has(upgrade.id);
          const unlocked = isUnlocked(upgrade);
          const canBuy = !isPurchased && unlocked && playerState.player.coins >= upgrade.base_price;

          return (
            <div
              key={upgrade.id}
              className={`rounded-xl border p-4 transition ${
                isPurchased
                  ? "border-green-500/25 bg-black/80 opacity-60"
                  : !unlocked
                    ? "border-violet-500/10 bg-black/60 opacity-50"
                    : "border-violet-500/20 bg-black/80 hover:border-violet-500/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-violet-500/30 bg-[rgba(30,20,40,0.6)]">
                    <span className="text-2xl">{getUpgradeIcon(upgrade.upgrade_type)}</span>
                  </div>
                  <div>
                    <h3 className="font-pixel text-base font-bold text-violet-100">{upgrade.name}</h3>
                    <p className="mt-1 font-pixel text-xs text-violet-300/90">
                      {getUpgradeDescription(upgrade)}
                    </p>
                    {!unlocked && (
                      <p className="mt-1 font-pixel text-[10px] text-violet-500/80">{getLockReason(upgrade)}</p>
                    )}
                  </div>
                </div>

                <div className="flex min-w-[90px] flex-col items-end gap-2">
                  {!isPurchased && (
                    <div className="flex items-center gap-1 font-pixel text-xs text-violet-500">
                      <span>⏱️</span>
                      <span>{upgrade.base_price.toLocaleString("ru-RU")}</span>
                    </div>
                  )}
                  {isPurchased ? (
                    <span className="font-pixel text-[10px] text-green-500">✓ куплено</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleBuy(upgrade.id)}
                      disabled={loading === upgrade.id || !canBuy}
                      className={`tap-target rounded-lg px-4 py-1.5 font-pixel text-[11px] transition ${
                        canBuy
                          ? "bg-gradient-to-b from-violet-600 to-violet-700 text-white shadow-md hover:scale-105 active:scale-95"
                          : "cursor-not-allowed bg-zinc-700 text-zinc-500"
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
        <p className="py-8 text-center font-pixel text-xs text-zinc-500">Пока нет доступных улучшений</p>
      )}
    </div>
  );
}

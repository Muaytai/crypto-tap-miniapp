"use client";

import { useState } from "react";
import { buyItem, type PlayerState } from "@/lib/api";
import { cryptoItemVisual } from "@/lib/cryptoItemVisual";

type Props = {
  initData: string;
  playerState: PlayerState;
  onPurchase: (newState: PlayerState) => void;
};

export function ItemShop({ initData, playerState, onPurchase }: Props) {
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMultiplier, setSelectedMultiplier] = useState<1 | 10 | 50>(1);
  // Определяем, в dev-режиме ли мы
  const isDev = initData === "dev" || initData === "test_init_data";

  // Функция для расчёта цены с учётом текущего количества и множителя
  const calculatePrice = (item: PlayerState["available_items"][0], currentQty: number, quantity: number): number => {
    let price = item.base_price;
    for (let i = 0; i < quantity; i++) {
      price = Math.floor(price * (currentQty + i > 0 ? 1.15 : 1));
    }
    return price;
  };

  const getTotalUpgradesToLevel = (level: number): number => {
    let total = 0;
    for (let lvl = 1; lvl < level; lvl++) total += lvl * 10;
    return total;
  };

  const getProgress = (currentLevel: number, totalUpgrades: number): number => {
    const neededForNext = currentLevel * 10;
    const alreadySpent = getTotalUpgradesToLevel(currentLevel);
    const currentLevelUpgrades = totalUpgrades - alreadySpent;
    const progress = (currentLevelUpgrades / neededForNext) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const getProgressColor = (progress: number): string => {
    if (progress < 33) return "bg-red-500";
    if (progress < 66) return "bg-yellow-500";
    return "bg-green-500";
  };

  // ---- ОБРАБОТЧИК ПОКУПКИ (DEV + PROD) ----
  const handleBuy = async (itemId: number, quantity: number) => {
    setLoading(itemId);
    setError(null);

    // DEV-режим: имитируем покупку локально
    if (isDev) {
      const item = playerState.available_items.find(i => i.id === itemId);
      if (!item) {
        setError("Предмет не найден");
        setLoading(null);
        return;
      }

      const currentPlayerItem = playerState.items.find(i => i.item_id === itemId);
      let currentQty = currentPlayerItem?.quantity || 0;
      let currentLevel = currentPlayerItem?.level || 1;

      const price = calculatePrice(item, currentQty, quantity);

      if (playerState.player.coins < price) {
        setError(`Не хватает монет! Нужно ${price.toLocaleString("ru-RU")}`);
        setLoading(null);
        return;
      }

      // Имитируем успешную покупку
      setTimeout(() => {
        let remainingUpgrades = quantity;
        let newQty = currentQty;
        let newLevel = currentLevel;

        while (remainingUpgrades > 0) {
          const neededForNext = newLevel * 10;
          const alreadySpent = getTotalUpgradesToLevel(newLevel);
          const currentInThisLevel = newQty - alreadySpent;
          const canTake = Math.min(remainingUpgrades, neededForNext - currentInThisLevel);
          newQty += canTake;
          remainingUpgrades -= canTake;
          if (newQty >= alreadySpent + neededForNext) newLevel++;
        }

        let nextPrice = item.base_price;
        for (let j = 0; j < newQty; j++) {
          nextPrice = Math.floor(nextPrice * (j > 0 ? 1.15 : 1));
        }
        const updatedAvailableItems = playerState.available_items.map(i =>
          i.id === itemId ? { ...i, base_price: nextPrice } : i
        );

        let updatedItems = playerState.items.map(item =>
          item.item_id === itemId ? { ...item, quantity: newQty, level: newLevel } : item
        );

        // Если предмета не было в списке, добавляем
        if (!playerState.items.some(i => i.item_id === itemId)) {
          updatedItems.push({
            item_id: itemId,
            item_name: item.name,
            item_icon: item.icon_name || "",
            quantity: newQty,
            level: newLevel,
            item_base_income: item.base_income_per_second,
            item_base_price: item.base_price,
          });
        }

        const updatedState = {
          ...playerState,
          player: {
            ...playerState.player,
            coins: playerState.player.coins - price,
          },
          items: updatedItems,
          available_items: updatedAvailableItems,
          income_per_second: playerState.income_per_second + (item.base_income_per_second * quantity),
        };

        onPurchase(updatedState);
        setLoading(null);
      }, 300);
      return;
    }

    // PROD-режим
    try {
      const result = await buyItem(initData, itemId, quantity);
      if (result.success) {
        const updatedState = {
          ...playerState,
          player: {
            ...playerState.player,
            coins: result.coins_left,
          },
          items: playerState.items.map(item =>
            item.item_id === itemId
              ? { ...item, quantity: result.new_quantity, level: result.new_level ?? item.level }
              : item
          ),
          income_per_second: result.cached_income_per_second,
        };
        // Если предмета не было в списке, добавляем
        if (!playerState.items.some(i => i.item_id === itemId)) {
          const newItem = {
            item_id: itemId,
            item_name: result.item_name,
            item_icon: playerState.available_items.find(i => i.id === itemId)?.icon_name || "",
            quantity: result.new_quantity,
            level: result.new_level ?? 1,
            item_base_income: playerState.available_items.find(i => i.id === itemId)?.base_income_per_second || 0,
            item_base_price: playerState.available_items.find(i => i.id === itemId)?.base_price || 0,
          };
          updatedState.items.push(newItem);
        }
        onPurchase(updatedState);
      } else {
        setError(result.error || "Ошибка покупки");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка покупки");
    } finally {
      setLoading(null);
    }
  };

  const getPriceForDisplay = (item: PlayerState["available_items"][0], quantity: number): number => {
    const currentQty = playerState.items.find(i => i.item_id === item.id)?.quantity || 0;
    return calculatePrice(item, currentQty, quantity);
  };

  const getCurrentQuantity = (itemId: number): number => {
    return playerState.items.find(i => i.item_id === itemId)?.quantity || 0;
  };

  const getCurrentLevel = (itemId: number): number => {
    return playerState.items.find(i => i.item_id === itemId)?.level || 1;
  };

  const allItems = playerState.available_items;
  const currentMultiplier = selectedMultiplier;

  const getFallbackEmoji = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("gpu")) return "🖥️";
    if (n.includes("asic")) return "⚙️";
    if (n.includes("блок")) return "🔌";
    if (n.includes("плоскогубцы")) return "🔧";
    if (n.includes("молоток")) return "🔨";
    if (n.includes("паяльник")) return "🛠️";
    if (n.includes("комната")) return "🏠";
    if (n.includes("персонаж")) return "🧑";
    if (n.includes("кнопка")) return "🔘";
    if (n.includes("стул")) return "🪑";
    if (n.includes("стол")) return "📐";
    if (n.includes("компьютер")) return "💻";
    if (n.includes("кружка")) return "☕";
    if (n.includes("ковёр")) return "🧶";
    if (n.includes("картина")) return "🖼️";
    if (n.includes("диван")) return "🛋️";
    return "📦";
  };

  return (
    <div className="flex h-full flex-col gap-4 bg-[#0f0c0a] px-4 pb-6">
      <div className="border-b-2 border-amber-500/30 pb-2 pt-4 text-center">
        <h1 className="font-pixel text-2xl font-bold tracking-[0.2em] text-amber-500">МАГАЗИН</h1>
      </div>

      {/* Кнопки кратности */}
      <div className="flex items-center justify-center gap-3 rounded-lg bg-black/40 p-2">
        <span className="font-pixel text-[0.7rem] text-amber-700">Кратность:</span>
        <div className="flex gap-2">
          {[1, 10, 50].map((mult) => (
            <button
              key={mult}
              onClick={() => setSelectedMultiplier(mult as 1 | 10 | 50)}
              className={`tap-target rounded border-2 px-4 py-1 font-pixel text-sm transition hover:scale-[1.02] ${
                currentMultiplier === mult
                  ? "border-amber-500 bg-amber-500/20 text-amber-300"
                  : "border-amber-700/50 text-amber-500/70 hover:border-amber-500/50"
              }`}
            >
              x{mult}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded border-2 border-red-700/50 bg-red-950/40 p-2 text-center font-pixel text-[10px] text-red-200">
          {error}
        </div>
      )}

      {/* DEV-режим предупреждение */}
      {isDev && (
        <div className="rounded border-2 border-amber-700/50 bg-amber-950/40 p-2 text-center font-pixel text-[10px] text-amber-300">
          ⚡ DEV-режим: покупки работают локально
        </div>
      )}

      {/* Список предметов */}
      <div className="flex flex-col gap-4">
        {allItems.map((item) => {
          const currentQty = getCurrentQuantity(item.id);
          const currentLevel = getCurrentLevel(item.id);
          const upgradesNeededForNext = currentLevel * 10;
          const alreadySpentTotal = getTotalUpgradesToLevel(currentLevel);
          const progress = getProgress(currentLevel, currentQty);
          const progressColor = getProgressColor(progress);
          const priceForSelected = getPriceForDisplay(item, currentMultiplier);
          const canAfford = playerState.player.coins >= priceForSelected;

          const fallbackEmoji = getFallbackEmoji(item.name);

          return (
            <div
              key={item.id}
              className="rounded-xl border border-amber-500/20 bg-black/30 p-4 transition hover:border-amber-500/50 hover:bg-black/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-amber-500/30 bg-[rgba(20,20,30,0.6)]">
                    <span className="text-2xl">{fallbackEmoji}</span>
                  </div>
                  <div>
                    <h3 className="font-pixel text-base font-bold text-amber-100">{item.name}</h3>
                    <p className="mt-1 font-pixel text-xs text-emerald-400">
                      +{item.base_income_per_second.toLocaleString("ru-RU")}/сек
                    </p>
                  </div>
                </div>

                <div className="flex min-w-[90px] flex-col items-end gap-2">
                  <div className="flex items-center gap-1 font-pixel text-xs text-amber-500">
                    <span>⏱️</span>
                    <span>{priceForSelected.toLocaleString("ru-RU")}</span>
                  </div>
                  <button
                    onClick={() => handleBuy(item.id, currentMultiplier)}
                    disabled={loading === item.id || !canAfford}
                    className={`tap-target rounded-lg px-4 py-1.5 font-pixel text-[11px] transition ${
                      canAfford
                        ? "bg-gradient-to-b from-amber-600 to-orange-700 text-white shadow-md hover:scale-105 active:scale-95"
                        : "cursor-not-allowed bg-zinc-700 text-zinc-500"
                    }`}
                  >
                    {loading === item.id ? "..." : "Купить"}
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="font-pixel text-xs text-amber-500">Ур. {currentLevel}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="font-pixel text-[10px] text-zinc-500">
                  {currentQty - alreadySpentTotal}/{upgradesNeededForNext}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {allItems.length === 0 && (
        <p className="py-8 text-center font-pixel text-xs text-zinc-500">Магазин пуст</p>
      )}
    </div>
  );
}
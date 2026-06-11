"use client";

import { useState } from "react";
import { buyItem, type PlayerState } from "@/lib/api";

type Props = {
  initData: string;
  playerState: PlayerState;
  onPurchase: (newState: PlayerState) => void;
};

// Только эти компоненты показываем в магазине
const COMPONENT_IDS = [1, 2, 3, 4]; // Диван, Стол, Ноутбук, Стул

export function ItemShop({ initData, playerState, onPurchase }: Props) {
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMultiplier, setSelectedMultiplier] = useState<1 | 10 | 50>(1);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});
  const isDev = initData === "dev" || initData === "test_init_data";

  // Фильтруем только нужные компоненты
  const shopItems = playerState.available_items.filter(item =>
    COMPONENT_IDS.includes(item.id)
  );

  // Функция расчёта цены с удорожанием на 15% за каждую покупку
  const calculatePrice = (item: PlayerState["available_items"][0], currentQty: number, quantity: number): number => {
    let price = item.base_price;
    for (let i = 0; i < quantity; i++) {
      // Увеличиваем цену на 15% за каждую купленную единицу
      price = Math.floor(price * (currentQty + i > 0 ? 1.15 : 1));
    }
    return price;
  };

  const getTotalUpgradesForLevel = (level: number): number => {
    return level * 10;
  };

  const getProgress = (currentLevel: number, totalUpgrades: number): number => {
    const neededForNext = currentLevel * 10;
    const alreadySpent = getTotalUpgradesForLevel(currentLevel - 1);
    const currentInThisLevel = Math.max(0, totalUpgrades - alreadySpent);
    const progress = (currentInThisLevel / neededForNext) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const getProgressColor = (progress: number): string => {
    if (progress < 33) return "bg-red-500";
    if (progress < 66) return "bg-yellow-500";
    return "bg-green-500";
  };

  const handleImageError = (itemId: number) => {
    setImgErrors(prev => ({ ...prev, [itemId]: true }));
  };

  const handleBuy = async (itemId: number, quantity: number) => {
    setLoading(itemId);
    setError(null);

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

      // Рассчитываем цену с учётом удорожания
      const price = calculatePrice(item, currentQty, quantity);

      if (playerState.player.coins < price) {
        setError(`Не хватает монет! Нужно ${price.toLocaleString("ru-RU")}`);
        setLoading(null);
        return;
      }

      setTimeout(() => {
        let remainingUpgrades = quantity;
        let newQty = currentQty;
        let newLevel = currentLevel;

        while (remainingUpgrades > 0) {
          const neededForNext = newLevel * 10;
          const alreadySpent = getTotalUpgradesForLevel(newLevel - 1);
          const currentInThisLevel = newQty - alreadySpent;
          const canTake = Math.min(remainingUpgrades, neededForNext - currentInThisLevel);
          newQty += canTake;
          remainingUpgrades -= canTake;
          if (newQty >= alreadySpent + neededForNext) {
            newLevel++;
          }
        }
        newLevel = Math.min(newLevel, 10);

        // Обновляем цену для следующей покупки (удорожание)
        let nextPrice = item.base_price;
        for (let j = 0; j < newQty; j++) {
          nextPrice = Math.floor(nextPrice * (j > 0 ? 1.15 : 1));
        }

        const updatedAvailableItems = playerState.available_items.map(i =>
          i.id === itemId ? { ...i, base_price: nextPrice } : i
        );

        const updatedItems = playerState.items.map(item =>
          item.item_id === itemId ? { ...item, quantity: newQty, level: newLevel } : item
        );

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

  const currentMultiplier = selectedMultiplier;

  // СТАТИЧНАЯ иконка — путь не зависит от уровня
  const getStaticImage = (itemName: string): string => {
    // Убираем пробелы для имени файла
    const fileName = itemName.replace(/\s/g, '');
    return `/images/ItemShop/${fileName}.png`;
  };

  // fallback эмодзи на случай ошибки
  const getFallbackEmoji = (itemName: string): string => {
    if (itemName.includes("Диван")) return "🛋️";
    if (itemName.includes("Стол")) return "🪵";
    if (itemName.includes("Ноутбук")) return "💻";
    if (itemName.includes("Стул")) return "🪑";
    return "📦";
  };

  return (
    <div className="flex h-full flex-col gap-4 bg-[#0f0c0a] px-4 pb-6">
      <div className="border-b-2 text-cyan-400/30 pb-2 pt-4 text-center">
        <h1 className="font-pixel text-2xl font-bold tracking-[0.2em] text-cyan-500">МАГАЗИН</h1>
      </div>

      <div className="flex items-center justify-center gap-3 rounded-lg bg-black/80 p-2">
        <span className="font-pixel text-[0.7rem] text-cyan-700">Кратность:</span>
        <div className="flex gap-2">
          {[1, 10, 50].map((mult) => (
            <button
              key={mult}
              onClick={() => setSelectedMultiplier(mult as 1 | 10 | 50)}
              className={`tap-target rounded border-2 px-4 py-1 font-pixel text-sm transition hover:scale-[1.02] ${
                currentMultiplier === mult
                  ? "text-cyan-400 bg-cyan-500/20 text-cyan-300"
                  : "text-cyan-700/50 text-cyan-500/70 hover:border-cyan-500/50"
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

      {isDev && (
        <div className="rounded border-2 border-cyan-700/50 bg-cyan-950/40 p-2 text-center font-pixel text-[10px] text-cyan-300">
          ⚡ DEV-режим: покупки работают локально
        </div>
      )}

      <div className="flex flex-col gap-4">
        {shopItems.map((item) => {
          const currentQty = getCurrentQuantity(item.id);
          const currentLevel = getCurrentLevel(item.id);
          const neededForNext = currentLevel * 10;
          const alreadySpent = (currentLevel - 1) * 10;
          const currentInThisLevel = Math.max(0, currentQty - alreadySpent);
          const progress = (currentInThisLevel / neededForNext) * 100;
          const progressColor = getProgressColor(progress);
          const priceForSelected = getPriceForDisplay(item, currentMultiplier);
          const canAfford = playerState.player.coins >= priceForSelected;

          const imageUrl = getStaticImage(item.name);
          const fallbackEmoji = getFallbackEmoji(item.name);
          const hasError = imgErrors[item.id];

          return (
            <div
              key={item.id}
              className="rounded-xl border border-cyan-500/20 bg-black/80 p-4 transition hover:border-cyan-500/50 hover:bg-black/80"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-cyan-500/30 bg-[rgba(20,20,30,0.6)] overflow-hidden">
                    {!hasError ? (
                      <img
                        src={imageUrl}
                        alt={item.name}
                        className="h-full w-full object-contain"
                        onError={() => handleImageError(item.id)}
                      />
                    ) : (
                      <span className="text-2xl">{fallbackEmoji}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-pixel text-base font-bold text-cyan-100">{item.name}</h3>
                    <p className="mt-1 font-pixel text-xs text-emerald-400">
                      +{item.base_income_per_second.toLocaleString("ru-RU")}/сек
                    </p>
                  </div>
                </div>

                <div className="flex min-w-[90px] flex-col items-end gap-2">
                  <div className="flex items-center gap-1 font-pixel text-xs text-cyan-500">
                    <span>⏱️</span>
                    <span>{priceForSelected.toLocaleString("ru-RU")}</span>
                  </div>
                  <button
                    onClick={() => handleBuy(item.id, currentMultiplier)}
                    disabled={loading === item.id || !canAfford}
                    className={`tap-target rounded-lg px-4 py-1.5 font-pixel text-[11px] transition ${
                      canAfford
                        ? "bg-gradient-to-b from-cyan-600 to-cyan-700 text-white shadow-md hover:scale-105 active:scale-95"
                        : "cursor-not-allowed bg-zinc-700 text-zinc-500"
                    }`}
                  >
                    {loading === item.id ? "..." : "Купить"}
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="font-pixel text-xs text-cyan-500">Ур. {currentLevel}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
                <span className="font-pixel text-[10px] text-zinc-500">
                  {currentInThisLevel}/{neededForNext}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {shopItems.length === 0 && (
        <p className="py-8 text-center font-pixel text-xs text-zinc-500">Магазин пуст</p>
      )}
    </div>
  );
}
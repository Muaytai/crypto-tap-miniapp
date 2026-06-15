"use client";

import { useState, useEffect } from "react";
import { buyItem, type PlayerState } from "@/lib/api";

type Props = {
  initData: string;
  playerState: PlayerState;
  onPurchase: (newState: PlayerState) => void;
};

const COMPONENT_IDS = [1, 2, 3, 4];

// Форматирование больших чисел (K, M, B, T и т.д.)
const formatPrice = (num: number): string => {
  if (num < 1000) return num.toLocaleString("ru-RU");

  const units = ["", "K", "M", "B", "T", "Qa", "Qi"];
  let value = num;
  let unitIndex = 0;

  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex++;
  }

  // Округляем до 2-3 значащих цифр
  const formatted = value >= 100
    ? Math.floor(value).toString()
    : value.toFixed(1).replace(/\.0$/, "");

  return `${formatted}${units[unitIndex]}`;
};

export function ItemShop({ initData, playerState, onPurchase }: Props) {
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMultiplier, setSelectedMultiplier] = useState<1 | 10 | 50>(1);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});
  const [recentPurchase, setRecentPurchase] = useState<number | null>(null);
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

  const getTotalUpgradesForLevel = (level: number): number => level * 10;

  const getProgressColor = (progress: number): string => {
    if (progress < 40) return "bg-red-500";
    if (progress < 75) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  const handleImageError = (itemId: number) => {
    setImgErrors(prev => ({ ...prev, [itemId]: true }));
  };

  const handleBuy = async (itemId: number, quantity: number) => {
    // ... (handleBuy остаётся без изменений)
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
        setError(`Не хватает монет! Нужно ${formatPrice(price)}`);
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
          if (newQty >= alreadySpent + neededForNext) newLevel++;
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
          player: { ...playerState.player, coins: playerState.player.coins - price },
          items: updatedItems,
          available_items: updatedAvailableItems,
          income_per_second: playerState.income_per_second + (item.base_income_per_second * quantity),
        };

        onPurchase(updatedState);
        setRecentPurchase(itemId);
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
          player: { ...playerState.player, coins: result.coins_left },
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
        setRecentPurchase(itemId);
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
      const timer = setTimeout(() => setRecentPurchase(null), 1200);
      return () => clearTimeout(timer);
    }
  }, [recentPurchase]);

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

  // СТАТИЧНАЯ иконка
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
    <div className="flex h-full flex-col bg-[#0a0806] px-4 pb-6">
      {/* Header */}
      <div className="border-b border-cyan-500/10 pb-4 pt-5">
        <h1 className="font-pixel text-center text-3xl font-bold tracking-[0.15em] text-cyan-400 drop-shadow-[0_0_15px_#22d3ee]">
          МАГАЗИН
        </h1>
        <p className="mt-1 text-center font-mono text-xs text-cyan-500/60">Покупай • Улучшай • Доминируй</p>
      </div>

      {/* Multiplier Selector */}
      <div className="mt-5 flex items-center justify-center gap-3 rounded-2xl bg-black/60 p-2 backdrop-blur-xl border border-white/5">
        <span className="font-pixel text-sm text-cyan-400/80 pl-2">КРАТНОСТЬ:</span>
        <div className="flex gap-1.5">
          {[1, 10, 50].map((mult) => (
            <button
              key={mult}
              onClick={() => setSelectedMultiplier(mult as 1 | 10 | 50)}
              className={`tap-target px-6 py-2.5 font-pixel text-sm rounded-xl border transition-all duration-200 ${
                selectedMultiplier === mult
                  ? "bg-cyan-500 text-black border-cyan-400 shadow-[0_0_20px_#22d3ee] scale-105"
                  : "bg-zinc-900/80 border-white/10 hover:border-cyan-500/50 text-cyan-400/70 hover:text-cyan-300"
              }`}
            >
              ×{mult}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-950/50 p-3 text-center text-sm text-red-200 backdrop-blur-md">
          {error}
        </div>
      )}

      {isDev && (
        <div className="mt-4 rounded-2xl border border-cyan-400/30 bg-cyan-950/30 p-3 text-center text-xs text-cyan-400 backdrop-blur-md">
          ⚡ DEV MODE — локальные покупки
        </div>
      )}

      {/* Items */}
      <div className="mt-6 flex flex-col gap-4">
        {shopItems.map((item) => {
          const currentQty = getCurrentQuantity(item.id);
          const currentLevel = getCurrentLevel(item.id);
          const neededForNext = currentLevel * 10;
          const alreadySpent = (currentLevel - 1) * 10;
          const currentInThisLevel = Math.max(0, currentQty - alreadySpent);
          const progress = (currentInThisLevel / neededForNext) * 100;
          const progressColor = getProgressColor(progress);

          const priceForSelected = getPriceForDisplay(item, selectedMultiplier);
          const canAfford = playerState.player.coins >= priceForSelected;

          const imageUrl = getStaticImage(item.name);
          const hasError = imgErrors[item.id];
          const isPurchased = recentPurchase === item.id;

          return (
            <div
              key={item.id}
              className={`group relative overflow-hidden rounded-3xl border p-5 transition-all duration-300 backdrop-blur-xl ${
                isPurchased
                  ? "border-emerald-400 shadow-2xl shadow-emerald-500/50 scale-[1.02]"
                  : "border-white/10 bg-zinc-950/80 hover:border-cyan-400/40 hover:shadow-2xl hover:shadow-cyan-500/10"
              }`}
            >
              {isPurchased && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="animate-floatUp text-3xl font-bold text-emerald-400 drop-shadow-[0_0_15px_#10b981] flex flex-col items-center">
                    +{selectedMultiplier}
                    <span className="text-sm mt-1 opacity-80">КУПЛЕНО</span>
                  </div>
                </div>
              )}

              <div className="flex gap-5">
                {/* Image */}
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-cyan-500/20 bg-zinc-900/80 p-2">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {!hasError ? (
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="h-full w-full object-contain drop-shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-transform group-hover:scale-110 duration-300"
                      onError={() => handleImageError(item.id)}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-5xl">
                      {getFallbackEmoji(item.name)}
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col min-w-0">
                  <div>
                    <h3 className="font-pixel text-xl font-bold text-white tracking-wide">{item.name}</h3>
                    <p className="text-emerald-400 font-mono text-sm mt-0.5">
                      +{item.base_income_per_second.toLocaleString("ru-RU")}/сек
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-3xl text-cyan-400">₿</span>
                      <span className="font-mono text-[28px] leading-none font-semibold text-cyan-300 tabular-nums tracking-[-0.02em]">
                        {formatPrice(priceForSelected)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleBuy(item.id, selectedMultiplier)}
                      disabled={loading === item.id || !canAfford}
                      className={`tap-target w-full py-3.5 rounded-2xl font-pixel text-sm font-bold transition-all duration-200 shadow-lg ${
                        canAfford
                          ? "bg-gradient-to-b from-cyan-400 to-cyan-600 text-black hover:brightness-110 active:scale-[0.97] shadow-cyan-500/50"
                          : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      }`}
                    >
                      {loading === item.id ? "..." : "КУПИТЬ"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                  <span className="text-cyan-400">УРОВЕНЬ {currentLevel}</span>
                  <span className="text-zinc-500">{currentInThisLevel} / {neededForNext}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-900 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {shopItems.length === 0 && (
        <p className="py-20 text-center font-mono text-xs text-zinc-500">Магазин пуст</p>
      )}
    </div>
  );
}
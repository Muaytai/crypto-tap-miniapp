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

      const currentQty = playerState.items.find(i => i.item_id === itemId)?.quantity || 0;
      const price = calculatePrice(item, currentQty, quantity);

      if (playerState.player.coins < price) {
        setError(`Не хватает монет! Нужно ${price.toLocaleString("ru-RU")}`);
        setLoading(null);
        return;
      }

      // Имитируем успешную покупку
      setTimeout(() => {
        const newQty = currentQty + quantity;

        const updatedAvailableItems = playerState.available_items.map(i => {
          if (i.id === itemId) {
            let nextPrice = item.base_price;
            for (let j = 0; j < newQty; j++) {
              nextPrice = Math.floor(nextPrice * (j > 0 ? 1.15 : 1));
            }
            return { ...i, base_price: nextPrice };
          }
          return i;
        });

        const updatedState = {
          ...playerState,
          player: {
            ...playerState.player,
            coins: playerState.player.coins - price,
          },
          items: playerState.items.map(item =>
            item.item_id === itemId
              ? { ...item, quantity: newQty }
              : item
          ),
          available_items: updatedAvailableItems,
          income_per_second: playerState.income_per_second + (item.base_income_per_second * quantity),
        };

        // Если предмета не было в списке, добавляем
        if (!playerState.items.some(i => i.item_id === itemId)) {
          updatedState.items.push({
            item_id: itemId,
            item_name: item.name,
            item_icon: item.icon_name || "",
            quantity: newQty,
            item_base_income: item.base_income_per_second,
            item_base_price: item.base_price,
          });
        }

        onPurchase(updatedState);
        setLoading(null);
      }, 300);
      return;
    }

    // Реальный API-запрос
    try {
      const result = await buyItem(initData, itemId, quantity);
      if (result.success) {
        // Обновляем состояние игрока
        const updatedState = {
          ...playerState,
          player: {
            ...playerState.player,
            coins: result.coins_left,
          },
          items: playerState.items.map(item =>
            item.item_id === itemId
              ? { ...item, quantity: result.new_quantity }
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
            item_base_income: playerState.available_items.find(i => i.id === itemId)?.base_income_per_second || 0,
            item_base_price: playerState.available_items.find(i => i.id === itemId)?.base_price || 0,
          };
          updatedState.items.push(newItem);
        }
        onPurchase(updatedState);
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

  const allItems = playerState.available_items;
  const currentMultiplier = selectedMultiplier;

  return (
    <div className="flex flex-col gap-4 bg-[#0f0c0a] px-4 pb-6" style={{ minHeight: "100%" }}>
      {/* Заголовок */}
      <div className="border-b-2 border-amber-500/30 pb-2 pt-4 text-center">
        <h1 className="font-pixel text-2xl font-bold tracking-[0.2em] text-amber-500" style={{ textShadow: "0 0 8px rgba(245,158,11,0.4)" }}>МАГАЗИН</h1>
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
          ⚡ DEV-режим: покупки работают локально без сервера
        </div>
      )}

      {/* Список предметов */}
      <div className="flex flex-col gap-4">
        {allItems.map((item) => {
          const currentQty = getCurrentQuantity(item.id);
          const priceForSelected = getPriceForDisplay(item, currentMultiplier);
          const canAfford = playerState.player.coins >= priceForSelected;
          const visual = cryptoItemVisual(item.name);

          return (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-black/30 p-3 transition hover:border-amber-500/50 hover:bg-black/50">
              <div className="flex flex-[2] items-center gap-4">
                {/* Иконка */}
                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg border border-amber-500/30 bg-[rgba(20,20,30,0.6)]">
                  <span className="text-2xl">{visual.emoji}</span>
                  <span className="font-pixel text-[0.55rem] text-amber-500/70">{visual.tag}</span>
                </div>

                {/* Информация */}
                <div>
                  <h3 className="font-pixel text-base text-amber-100">{item.name}</h3>
                  <p className="mt-1 font-pixel text-xs text-emerald-400">+{item.base_income_per_second.toLocaleString("ru-RU")}/сек</p>
                </div>

                {/* Количество купленных */}
                <div className="min-w-[3rem] text-center">
                  <span className="font-pixel text-[1.75rem] font-bold text-amber-400">{currentQty}</span>
                </div>
              </div>

              <div className="flex min-w-[6rem] flex-col items-end gap-2">
                {/* Цена */}
                <div className="flex items-center gap-1 font-pixel text-xs text-amber-500">
                  <span>⏱️</span>
                  <span className="font-bold">{priceForSelected.toLocaleString("ru-RU")}</span>
                </div>

                {/* Кнопка покупки */}
                <button
                  onClick={() => handleBuy(item.id, currentMultiplier)}
                  disabled={loading === item.id || !canAfford}
                  className={`tap-target rounded-lg border-none px-5 py-2 font-pixel text-[0.7rem] transition ${
                    canAfford
                      ? "cursor-pointer bg-gradient-to-b from-amber-500 to-amber-700 text-white shadow-[0_2px_8px_rgba(245,158,11,0.3)] hover:scale-[1.02] hover:from-amber-400 hover:to-amber-600 active:scale-[0.98]"
                      : "cursor-not-allowed bg-zinc-700 text-zinc-500"
                  }`}
                >
                  {loading === item.id ? "..." : "Купить"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {allItems.length === 0 && (
        <p className="py-8 text-center font-pixel text-xs text-zinc-500">
          Магазин пуст
        </p>
      )}
    </div>
  );
}
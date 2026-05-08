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

  const handleBuy = async (itemId: number, quantity: number) => {
    setLoading(itemId);
    setError(null);
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
            quantity: result.new_quantity,
            item_base_income: playerState.available_items.find(i => i.id === itemId)?.base_income_per_second || 0,
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

  const getPriceForQuantity = (item: PlayerState["available_items"][0], currentQty: number, qty: number): number => {
    let price = item.base_price;
    for (let i = 0; i < qty; i++) {
      price = Math.floor(price * (currentQty + i > 0 ? 1.15 : 1));
    }
    return price;
  };

  const getCurrentQuantity = (itemId: number): number => {
    return playerState.items.find(i => i.item_id === itemId)?.quantity || 0;
  };
  const allItems = playerState.available_items;

  return (
    <div className="flex flex-col gap-3 px-3 pb-4">
      <div className="mb-1 border-b-2 border-amber-800/40 pb-1.5">
        <h2 className="font-pixel text-sm font-bold uppercase tracking-wide text-amber-100">
          Магазин
        </h2>
      </div>

      {error && (
        <div className="border-2 border-red-700/50 bg-red-950/40 p-2 font-pixel text-[10px] text-red-200">
          {error}
        </div>
      )}

      {/* Кнопки x1 x10 x50 */}
      <div className="flex gap-2 border-b border-amber-800/30 pb-2">
        <span className="font-pixel text-xs text-amber-500">Кратность:</span>
        <div className="flex gap-2">
          <button className="font-pixel rounded border border-cyan-500/50 px-2 py-0.5 text-xs text-cyan-400">x1</button>
          <button className="font-pixel rounded border border-cyan-500/50 px-2 py-0.5 text-xs text-cyan-400">x10</button>
          <button className="font-pixel rounded border border-cyan-500/50 px-2 py-0.5 text-xs text-cyan-400">x50</button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {allItems.map((item) => {
          const currentQty = getCurrentQuantity(item.id);
          const price1 = getPriceForQuantity(item, currentQty, 1);
          const canAfford = playerState.player.coins >= price1;
          const price10 = getPriceForQuantity(item, currentQty, 10);
          const price50 = getPriceForQuantity(item, currentQty, 50);
          const canAfford1 = playerState.player.coins >= price1;

          const visual = cryptoItemVisual(item.name);
          return (
            <div
              key={item.id}
              className="flex items-center justify-between border-b border-amber-800/25 py-2 last:border-b-0"
            >
              {/* Левая часть: иконка + название + доход */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-col items-center justify-center rounded border border-cyan-600/30 bg-cyan-950/20">
                  <span className="text-xl">{visual.emoji}</span>
                  <span className="font-pixel text-[8px] text-cyan-400/70">{visual.tag}</span>
                </div>
                <div>
                  <h3 className="font-pixel text-sm text-amber-50">{item.name}</h3>
                  <p className="font-pixel text-[10px] text-cyan-400">
                    +{item.base_income_per_second.toLocaleString("ru-RU")}/сек
                  </p>
                </div>
              </div>

              {/* Правая часть: количество + цена + кнопка */}
              <div className="flex items-center gap-2 text-right">
                <span className="font-pixel min-w-[3rem] text-base font-bold text-amber-300">
                  {currentQty}
                </span>
                <button
                  onClick={() => handleBuy(item.id, 1)}
                  disabled={loading === item.id || !canAfford}
                  className={`tap-target font-pixel border px-3 py-1.5 text-[11px] transition ${
                    canAfford
                      ? "border-cyan-500/60 bg-gradient-to-b from-cyan-700 to-blue-800 text-white active:translate-y-px"
                      : "cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-600"
                  }`}
                >
                  {price1.toLocaleString("ru-RU")}
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
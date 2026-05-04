"use client";

import { useState } from "react";
import { buyItem, type PlayerState } from "@/lib/api";

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

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Магазин</h2>
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
        {playerState.available_items.map((item) => {
          const currentQty = getCurrentQuantity(item.id);
          const price1 = getPriceForQuantity(item, currentQty, 1);
          const price10 = getPriceForQuantity(item, currentQty, 10);
          const price50 = getPriceForQuantity(item, currentQty, 50);
          const canAfford1 = playerState.player.coins >= price1;

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-500/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-white">{item.name}</h3>
                  <p className="text-xs text-zinc-500">
                    +{item.base_income_per_second}/сек
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleBuy(item.id, 1)}
                      disabled={loading === item.id || !canAfford1}
                      className={`tap-target rounded-xl px-4 py-2 text-sm font-medium transition ${
                        canAfford1
                          ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:scale-105"
                          : "bg-zinc-700 text-zinc-500"
                      }`}
                    >
                      x1 ({price1.toLocaleString("ru-RU")})
                    </button>
                    <button
                      onClick={() => handleBuy(item.id, 10)}
                      disabled={loading === item.id || playerState.player.coins < price10}
                      className={`tap-target rounded-xl px-4 py-2 text-sm font-medium transition ${
                        playerState.player.coins >= price10
                          ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:scale-105"
                          : "bg-zinc-700 text-zinc-500"
                      }`}
                    >
                      x10 ({price10.toLocaleString("ru-RU")})
                    </button>
                    <button
                      onClick={() => handleBuy(item.id, 50)}
                      disabled={loading === item.id || playerState.player.coins < price50}
                      className={`tap-target rounded-xl px-4 py-2 text-sm font-medium transition ${
                        playerState.player.coins >= price50
                          ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:scale-105"
                          : "bg-zinc-700 text-zinc-500"
                      }`}
                    >
                      x50 ({price50.toLocaleString("ru-RU")})
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-cyan-400">{currentQty}</p>
                  <p className="text-xs text-zinc-500">шт.</p>
                </div>
              </div>
              {loading === item.id && (
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-1/2 animate-pulse rounded-full bg-cyan-500" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
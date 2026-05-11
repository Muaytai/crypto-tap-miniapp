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
  const visibleItems = playerState.available_items.slice(0, 3);

  return (
    <div className="flex flex-col gap-2.5 px-2 pb-4">
      <div className="mb-0.5 pb-1.5">
        <h2 className="font-pixel text-sm font-bold uppercase tracking-wide text-amber-100/95 sm:text-base">
          Магазин
        </h2>
      </div>

      {error && (
        <div className="border-2 border-red-700/50 bg-red-950/40 p-2 font-pixel text-[11px] text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {visibleItems.map((item) => {
          const currentQty = getCurrentQuantity(item.id);
          const price1 = getPriceForQuantity(item, currentQty, 1);
          const price10 = getPriceForQuantity(item, currentQty, 10);
          const price50 = getPriceForQuantity(item, currentQty, 50);
          const canAfford1 = playerState.player.coins >= price1;

          const visual = cryptoItemVisual(item.name);
          return (
            <div
              key={item.id}
              className="border-b border-amber-800/25 py-2.5 last:border-b-0"
            >
              <div className="flex items-start gap-2">
                <div
                  className="flex h-[3.25rem] w-[3.25rem] shrink-0 flex-col items-center justify-center rounded-sm border border-cyan-600/35 bg-cyan-950/20 sm:h-14 sm:w-14"
                  title={visual.tag}
                >
                  <span className="text-xl leading-none sm:text-2xl" aria-hidden>
                    {visual.emoji}
                  </span>
                  <span className="font-pixel mt-0.5 text-[7px] text-cyan-300/80">{visual.tag}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-pixel text-sm text-amber-50 sm:text-base">{item.name}</h3>
                  <p className="font-pixel mt-0.5 text-[11px] text-cyan-400/90">
                    +{item.base_income_per_second} хеш/сек
                  </p>
                  {currentQty > 0 && (
                    <p className="font-pixel mt-0.5 text-[10px] text-amber-200/60">
                      Куплено: {currentQty}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleBuy(item.id, 1)}
                      disabled={loading === item.id || !canAfford1}
                      className={`tap-target font-pixel border-2 px-2 py-1.5 text-[10px] sm:text-[11px] ${
                        canAfford1
                          ? "border-cyan-500/60 bg-gradient-to-b from-cyan-600 to-blue-700 text-white active:translate-y-px"
                          : "cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-600"
                      }`}
                    >
                      x1 ({price1.toLocaleString("ru-RU")})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBuy(item.id, 10)}
                      disabled={loading === item.id || playerState.player.coins < price10}
                      className={`tap-target font-pixel border-2 px-2 py-1.5 text-[10px] sm:text-[11px] ${
                        playerState.player.coins >= price10
                          ? "border-violet-500/60 bg-gradient-to-b from-violet-600 to-purple-800 text-white active:translate-y-px"
                          : "cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-600"
                      }`}
                    >
                      x10 ({price10.toLocaleString("ru-RU")})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBuy(item.id, 50)}
                      disabled={loading === item.id || playerState.player.coins < price50}
                      className={`tap-target font-pixel border-2 px-2 py-1.5 text-[10px] sm:text-[11px] ${
                        playerState.player.coins >= price50
                          ? "border-amber-500/70 bg-gradient-to-b from-amber-600 to-orange-700 text-white active:translate-y-px"
                          : "cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-600"
                      }`}
                    >
                      x50 ({price50.toLocaleString("ru-RU")})
                    </button>
                  </div>
                </div>
              </div>
              {loading === item.id && (
                <div className="mt-2 h-1 w-full overflow-hidden border border-amber-900/50 bg-black/40">
                  <div className="h-full w-1/2 animate-pulse bg-cyan-500" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
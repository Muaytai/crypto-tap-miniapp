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

      // Рассчитываем цену (локально)
      let price = item.base_price;
      for (let i = 0; i < quantity; i++) {
        price = Math.floor(price * (currentQty + i > 0 ? 1.15 : 1));
      }

      if (playerState.player.coins < price) {
        setError(`Не хватает монет! Нужно ${price.toLocaleString("ru-RU")}`);
        setLoading(null);
        return;
      }

      // Имитируем успешную покупку
      setTimeout(() => {
        const newQty = currentQty + quantity;
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
          income_per_second: playerState.income_per_second + (item.base_income_per_second * quantity),
        };

        // Если предмета не было в списке, добавляем
        if (!playerState.items.some(i => i.item_id === itemId)) {
          updatedState.items.push({
            item_id: itemId,
            item_name: item.name,
            quantity: newQty,
            item_base_income: item.base_income_per_second,
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
  const currentMultiplier = selectedMultiplier;

  return (
    <div className="shop-container flex flex-col gap-4 px-4 pb-6">
      {/* Заголовок */}
      <div className="shop-header">
        <h1 className="shop-title">МАГАЗИН</h1>
      </div>

      {/* Кнопки кратности */}
      <div className="multiplier-bar flex items-center justify-center gap-3">
        <span className="multiplier-label">Кратность:</span>
        <div className="multiplier-buttons flex gap-2">
          {[1, 10, 50].map((mult) => (
            <button
              key={mult}
              onClick={() => setSelectedMultiplier(mult as 1 | 10 | 50)}
              className={`multiplier-btn px-4 py-1 font-pixel text-sm transition ${
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
        <div className="error-message border-2 border-red-700/50 bg-red-950/40 p-2 font-pixel text-[10px] text-red-200 text-center">
          {error}
        </div>
      )}

      {/* DEV-режим предупреждение */}
      {isDev && (
        <div className="dev-warning border-2 border-amber-700/50 bg-amber-950/40 p-2 font-pixel text-[10px] text-amber-300 text-center">
          ⚡ DEV-режим: покупки работают локально без сервера
        </div>
      )}

      {/* Список предметов */}
      <div className="shop-items flex flex-col gap-4">
        {allItems.map((item) => {
          const currentQty = getCurrentQuantity(item.id);
          const priceForSelected = getPriceForQuantity(item, currentQty, currentMultiplier);
          const canAfford = playerState.player.coins >= priceForSelected;
          const visual = cryptoItemVisual(item.name);

          return (
            <div key={item.id} className="shop-item">
              <div className="shop-item-left">
                {/* Иконка */}
                <div className="item-icon">
                  <span className="item-emoji">{visual.emoji}</span>
                  <span className="item-tag">{visual.tag}</span>
                </div>

                {/* Информация */}
                <div className="item-info">
                  <h3 className="item-name">{item.name}</h3>
                  <p className="item-income">+{item.base_income_per_second.toLocaleString("ru-RU")}/сек</p>
                </div>

                {/* Количество купленных */}
                <div className="item-quantity">
                  <span className="quantity-number">{currentQty}</span>
                </div>
              </div>

              <div className="shop-item-right">
                {/* Цена над кнопкой */}
                <div className="item-price">
                  <span className="price-icon">⏱️</span>
                  <span className="price-value">{priceForSelected.toLocaleString("ru-RU")}</span>
                </div>

                {/* Кнопка покупки */}
                <button
                  onClick={() => handleBuy(item.id, currentMultiplier)}
                  disabled={loading === item.id || !canAfford}
                  className={`buy-btn ${canAfford ? "can-buy" : "cannot-buy"}`}
                >
                  {loading === item.id ? "..." : "Купить"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {allItems.length === 0 && (
        <p className="empty-shop text-center font-pixel text-xs text-zinc-500 py-8">
          Магазин пуст
        </p>
      )}
    </div>
  );
}
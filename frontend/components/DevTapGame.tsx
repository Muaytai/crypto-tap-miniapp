"use client";

import { SimpleTapGame } from "@/components/SimpleTapGame";
import { ItemShop } from "@/components/ItemShop";
import { UpgradesPanel } from "@/components/UpgradesPanel";
import { PrestigePanel } from "@/components/PrestigePanel";
import { DailyReward } from "@/components/DailyReward";
import { AchievementsList } from "@/components/AchievementsList";
import { CelestialPanel } from "@/components/CelestialPanel";
import { useState } from "react";
import { NEW_UPGRADES_FOR_DEV } from "@/lib/upgradesCatalog";

type DockTab = "game" | "shop" | "upgrades" | "prestige" | "celestial" | "profile" | "top";

// Тестовые данные для разработки
const TEST_PLAYER_STATE = {
  player: {
    telegram_id: 777,
    username: "dev",
    first_name: "Разработчик",
    coins: 100000,
    total_taps: 1000,
    crystals: 10,
    total_earned_all_time: 1000000,
    prestige_count: 1,
    max_offline_minutes: 180,
  },
  items: [] as any[],
  upgrades: [] as any[],
  available_items: [
    { id: 13, name: "Плоскогубцы", base_income_per_second: 1, base_price: 10 },
    { id: 14, name: "Молоток", base_income_per_second: 5, base_price: 50 },
    { id: 15, name: "Паяльник", base_income_per_second: 25, base_price: 250 },
    { id: 16, name: "Горелка", base_income_per_second: 100, base_price: 1000 },
  ],
  available_upgrades: [
    { id: 1, name: "Закалённые руки", description: "Каждый тап приносит вдвое больше осколков.", upgrade_type: "click_multiplier", value: 2, base_price: 500, min_total_taps: 0, icon_name: "" },
    { id: 2, name: "Двойной хеш", description: "Усиливает силу клика — как повторный прогон nonce.", upgrade_type: "click_multiplier", value: 1.5, base_price: 5000, min_total_taps: 1000, icon_name: "" },
    { id: 3, name: "ASIC-пальцы", description: "Клики бьют по монетам, как чип под SHA-256.", upgrade_type: "click_multiplier", value: 2, base_price: 50000, min_total_taps: 10000, icon_name: "" },
    { id: 4, name: "Lightning tap", description: "Мгновенные клики — максимальный множитель тапа.", upgrade_type: "click_multiplier", value: 3, base_price: 500000, min_total_taps: 100000, icon_name: "" },
    { id: 5, name: "Разгон рига", description: "Пассивный доход от лаборатории +25%.", upgrade_type: "income_multiplier", value: 1.25, base_price: 2000, min_total_taps: 500, icon_name: "" },
    { id: 6, name: "Пул хешей", description: "Объединённый хеш-рейт фермы усиливает доход в секунду.", upgrade_type: "income_multiplier", value: 1.5, base_price: 25000, min_total_taps: 5000, icon_name: "" },
    { id: 7, name: "Дата-центр ×2", description: "Промышленный масштаб: пассивный доход удваивается.", upgrade_type: "income_multiplier", value: 2, base_price: 250000, min_total_taps: 50000, icon_name: "" },
    { id: 8, name: "Удлинённая смена", description: "Оффлайн-накопление ещё на 1 час (поверх базового лимита).", upgrade_type: "offline_extension", value: 60, base_price: 5000, min_total_taps: 0, icon_name: "" },
    { id: 9, name: "Ночная ферма", description: "Риг копит осколки дольше, пока вы offline.", upgrade_type: "offline_extension", value: 120, base_price: 50000, min_total_taps: 2500, icon_name: "" },
    { id: 10, name: "12-часовой буфер", description: "До 12 часов пассивного дохода без входа в игру.", upgrade_type: "offline_extension", value: 360, base_price: 500000, min_total_taps: 25000, icon_name: "" },
    ...NEW_UPGRADES_FOR_DEV,
  ],
  income_per_second: 10,
};

export function DevTapGame() {
  const [playerState, setPlayerState] = useState(TEST_PLAYER_STATE);
  const [dockTab, setDockTab] = useState<DockTab>("game");
  const [leaderboard] = useState(null);
  const tgUser = { id: 777, first_name: "Разработчик", username: "dev" };

  const handleSync = (newPlayer: any, incomePerSecond: number) => {
    setPlayerState(prev => ({
      ...prev,
      player: { ...prev.player, ...newPlayer },
      income_per_second: incomePerSecond,
    }));
  };

  const handlePurchase = (newState: any) => {
    setPlayerState(newState);
  };

  const handlePrestige = (newState: any) => {
    setPlayerState(newState);
    setDockTab("game");
  };

  const handleDailyReward = (coins: number, crystals: number) => {
    setPlayerState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        coins: prev.player.coins + coins,
        crystals: prev.player.crystals + crystals,
      },
    }));
  };

  const renderContent = () => {
    switch (dockTab) {
      case "game":
        return (
          <SimpleTapGame
            initData="dev"
            playerState={playerState}
            onSync={handleSync}
          />
        );
      case "shop":
        return (
          <ItemShop
            initData="dev"
            playerState={playerState}
            onPurchase={handlePurchase}
          />
        );
      case "upgrades":
        return (
          <UpgradesPanel
            initData="dev"
            playerState={playerState}
            onPurchase={handlePurchase}
          />
        );
      case "prestige":
        return (
          <PrestigePanel
            initData="dev"
            playerState={playerState}
            onPrestige={handlePrestige}
            onUpdate={handlePurchase}
          />
        );
      case "celestial":
        return (
          <CelestialPanel
            initData="dev"
            playerState={playerState}
            onUpdate={handlePurchase}
          />
        );
      case "profile":
        return (
          <div className="flex flex-col gap-4 p-3">
            <div className="rounded-2xl border border-violet-500/20 bg-black/40 p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-600/35 text-lg font-semibold text-violet-200">
                  {playerState.player.first_name?.[0] || "?"}
                </div>
                <div>
                  <p className="font-medium text-white">{playerState.player.first_name}</p>
                  <p className="text-xs text-zinc-500">@{playerState.player.username}</p>
                </div>
              </div>
            </div>
            <DailyReward initData="dev" onUpdate={handleDailyReward} />
            <AchievementsList initData="dev" playerState={playerState} onReward={handleDailyReward} />
          </div>
        );
      case "top":
        return (
          <div className="flex flex-col gap-3 p-3">
            <div className="rounded-2xl border border-white/10 bg-black/35 p-8 text-center text-zinc-500">
              🏆 Лидерборд доступен в Telegram-версии
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-dvh w-full flex-col">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💧</span>
            <div>
              <p className="text-xs text-zinc-500">Монет</p>
              <p className="text-lg font-bold text-cyan-400">
                {Math.floor(playerState.player.coins).toLocaleString("ru-RU")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">⚡</span>
            <p className="text-sm text-zinc-400">{playerState.income_per_second}/сек</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm">💎</span>
            <p className="text-sm text-purple-400">{playerState.player.crystals}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 pb-20">{renderContent()}</div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/90 backdrop-blur-md">
        <div className="flex justify-around py-2">
          {[
            { id: "game", label: "🎮", title: "Игра" },
            { id: "shop", label: "🛒", title: "Магазин" },
            { id: "upgrades", label: "⚡", title: "Улучшения" },
            { id: "prestige", label: "🔥", title: "Закалка" },
            { id: "celestial", label: "🌌", title: "Небесные" },
            { id: "profile", label: "👤", title: "Профиль" },
            { id: "top", label: "🏆", title: "Топ" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDockTab(tab.id as DockTab)}
              className={`tap-target flex flex-col items-center px-3 py-1 transition ${
                dockTab === tab.id ? "text-cyan-400" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span className="text-xl">{tab.label}</span>
              <span className="text-[10px]">{tab.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
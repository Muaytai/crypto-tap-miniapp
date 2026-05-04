"use client";

import { useState, useEffect } from "react";
import { SimpleTapGame } from "@/components/SimpleTapGame";
import { ItemShop } from "@/components/ItemShop";
import { UpgradesPanel } from "@/components/UpgradesPanel";
import { PrestigePanel } from "@/components/PrestigePanel";
import { DailyReward } from "@/components/DailyReward";
import { AchievementsList } from "@/components/AchievementsList";
import { CelestialPanel } from "@/components/CelestialPanel";
import { fetchFullState, type PlayerState } from "@/lib/api";
import { watchTelegramInitData } from "@/lib/telegram";

type DockTab = "game" | "shop" | "upgrades" | "prestige" | "celestial" | "profile" | "top";

export default function Home() {
  const [initData, setInitData] = useState("");
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DockTab>("game");

  // Получаем initData из Telegram
  useEffect(() => {
    return watchTelegramInitData((raw) => {
      setInitData(raw);
    });
  }, []);

  // Загружаем данные игрока
  useEffect(() => {
    if (!initData) return;

    const loadState = async () => {
      setLoading(true);
      try {
        const state = await fetchFullState(initData);
        setPlayerState(state);
      } catch (error) {
        console.error("Failed to load state:", error);
      } finally {
        setLoading(false);
      }
    };
    loadState();
  }, [initData]);

  // Если нет initData (разработка без Telegram) — используем тестовые данные
  if (!initData) {
    return <DevHome />;
  }

  // Загрузка
  if (loading || !playerState) {
    return (
      <div className="min-h-dvh bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent mx-auto mb-3" />
          <p className="text-zinc-500">Загрузка...</p>
        </div>
      </div>
    );
  }

  const handleSync = (newPlayer: any, incomePerSecond: number) => {
    setPlayerState(prev => prev ? {
      ...prev,
      player: { ...prev.player, ...newPlayer },
      income_per_second: incomePerSecond,
    } : null);
  };

  const handlePurchase = (newState: PlayerState) => {
    setPlayerState(newState);
  };

  const handlePrestige = (newState: PlayerState) => {
    setPlayerState(newState);
    setActiveTab("game");
  };

  const handleDailyReward = (coins: number, crystals: number) => {
    setPlayerState(prev => prev ? {
      ...prev,
      player: {
        ...prev.player,
        coins: prev.player.coins + coins,
        crystals: prev.player.crystals + crystals,
      },
    } : null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "game":
        return (
          <div className="flex-1 flex items-center justify-center">
            <SimpleTapGame
              initData={initData}
              playerState={playerState}
              onSync={handleSync}
            />
          </div>
        );
      case "shop":
        return (
          <div className="flex-1 pb-20">
            <ItemShop
              initData={initData}
              playerState={playerState}
              onPurchase={handlePurchase}
            />
          </div>
        );
      case "upgrades":
        return (
          <div className="flex-1 pb-20">
            <UpgradesPanel
              initData={initData}
              playerState={playerState}
              onPurchase={handlePurchase}
            />
          </div>
        );
      case "prestige":
        return (
          <div className="flex-1 pb-20">
            <PrestigePanel
              initData={initData}
              playerState={playerState}
              onPrestige={handlePrestige}
            />
          </div>
        );
      case "celestial":
        return (
          <div className="flex-1 pb-20">
            <CelestialPanel
              initData={initData}
              playerState={playerState}
              onUpdate={handlePurchase}
            />
          </div>
        );
      case "profile":
        return (
          <div className="flex-1 pb-20">
            <div className="flex flex-col gap-4 p-4">
              <div className="rounded-2xl border border-violet-500/20 bg-black/40 p-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-600/35 text-lg font-semibold text-violet-200">
                    {playerState.player.first_name?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-white">{playerState.player.first_name}</p>
                    <p className="text-xs text-zinc-500">@{playerState.player.username}</p>
                    <p className="text-xs text-zinc-600 mt-1">
                      🏆 Закалок: {playerState.player.prestige_count}
                    </p>
                  </div>
                </div>
              </div>
              <DailyReward initData={initData} onUpdate={handleDailyReward} />
              <AchievementsList initData={initData} playerState={playerState} onReward={handleDailyReward} />
            </div>
          </div>
        );
      case "top":
        return (
          <div className="flex-1 pb-20">
            <div className="flex flex-col gap-3 p-4">
              <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                <h3 className="text-lg font-semibold text-white mb-3">🏆 Топ игроков</h3>
                <p className="text-center text-zinc-500 py-8">Загрузка...</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-dvh bg-black text-white flex flex-col">
      {/* Верхняя панель */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur-md p-3">
        <div className="flex justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💧</span>
            <div>
              <p className="text-xs text-zinc-500">Монет</p>
              <p className="text-xl font-bold text-cyan-400">
                {Math.floor(playerState.player.coins).toLocaleString("ru-RU")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">⚡</span>
            <p className="text-sm text-zinc-400">{playerState.income_per_second}/сек</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">💎</span>
            <p className="text-sm text-purple-400">{playerState.player.crystals}</p>
          </div>
        </div>
      </div>

      {renderContent()}

      {/* Нижняя навигация */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/90 backdrop-blur-md">
        <div className="flex justify-around py-2 max-w-md mx-auto">
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
              onClick={() => setActiveTab(tab.id as DockTab)}
              className={`tap-target flex flex-col items-center px-3 py-1 transition ${
                activeTab === tab.id ? "text-cyan-400" : "text-zinc-500 hover:text-zinc-300"
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

// Компонент для разработки без Telegram
function DevHome() {
  const [playerState, setPlayerState] = useState<any>({
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
    items: [],
    upgrades: [],
    available_items: [
      { id: 13, name: "Плоскогубцы", base_income_per_second: 1, base_price: 10 },
      { id: 14, name: "Молоток", base_income_per_second: 5, base_price: 50 },
    ],
    available_upgrades: [
      { id: 12, name: "Закалённые руки", upgrade_type: "click_multiplier", value: 2.0, base_price: 500, min_total_taps: 0 },
    ],
    income_per_second: 10,
  });
  const [activeTab, setActiveTab] = useState<DockTab>("game");

  const handleSync = (newPlayer: any, incomePerSecond: number) => {
    setPlayerState((prev: any) => ({
      ...prev,
      player: { ...prev.player, ...newPlayer },
      income_per_second: incomePerSecond,
    }));
  };

  const handlePurchase = (newState: any) => setPlayerState(newState);
  const handlePrestige = (newState: any) => {
    setPlayerState(newState);
    setActiveTab("game");
  };
  const handleDailyReward = (coins: number, crystals: number) => {
    setPlayerState((prev: any) => ({
      ...prev,
      player: {
        ...prev.player,
        coins: prev.player.coins + coins,
        crystals: prev.player.crystals + crystals,
      },
    }));
  };

  const renderContent = () => {
    switch (activeTab) {
      case "game":
        return <div className="flex-1 flex items-center justify-center"><SimpleTapGame initData="dev" playerState={playerState} onSync={handleSync} /></div>;
      case "shop":
        return <div className="flex-1 pb-20"><ItemShop initData="dev" playerState={playerState} onPurchase={handlePurchase} /></div>;
      case "upgrades":
        return <div className="flex-1 pb-20"><UpgradesPanel initData="dev" playerState={playerState} onPurchase={handlePurchase} /></div>;
      case "prestige":
        return <div className="flex-1 pb-20"><PrestigePanel initData="dev" playerState={playerState} onPrestige={handlePrestige} /></div>;
      case "celestial":
        return <div className="flex-1 pb-20"><CelestialPanel initData="dev" playerState={playerState} onUpdate={handlePurchase} /></div>;
      case "profile":
        return (
          <div className="flex-1 pb-20 p-4">
            <div className="rounded-2xl border border-violet-500/20 bg-black/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-600/35 text-lg font-semibold text-violet-200">Д</div>
                <div><p className="font-medium text-white">Разработчик</p><p className="text-xs text-zinc-500">@dev</p></div>
              </div>
            </div>
            <DailyReward initData="dev" onUpdate={handleDailyReward} />
            <AchievementsList initData="dev" playerState={playerState} onReward={handleDailyReward} />
          </div>
        );
      case "top":
        return <div className="flex-1 pb-20 p-4 text-center text-zinc-500">🏆 Лидерборд (Telegram only)</div>;
      default: return null;
    }
  };

  return (
    <div className="min-h-dvh bg-black text-white flex flex-col">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur-md p-3">
        <div className="flex justify-between max-w-md mx-auto">
          <div><span className="text-2xl">💧</span><p className="text-xl font-bold text-cyan-400">{Math.floor(playerState.player.coins).toLocaleString()}</p></div>
          <div><span className="text-sm">⚡</span><p className="text-sm text-zinc-400">{playerState.income_per_second}/сек</p></div>
          <div><span className="text-sm">💎</span><p className="text-sm text-purple-400">{playerState.player.crystals}</p></div>
        </div>
      </div>
      {renderContent()}
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
            <button key={tab.id} onClick={() => setActiveTab(tab.id as DockTab)} className={`tap-target flex flex-col items-center px-3 py-1 transition ${activeTab === tab.id ? "text-cyan-400" : "text-zinc-500"}`}>
              <span className="text-xl">{tab.label}</span>
              <span className="text-[10px]">{tab.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
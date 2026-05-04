"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchFullState, type PlayerState } from "@/lib/api";
import {
  dockTabFromHash,
  getTelegramWebApp,
  historyUrlForDockTab,
  watchTelegramInitData,
} from "@/lib/telegram";
import { SimpleTapGame } from "@/components/SimpleTapGame";
import { ItemShop } from "@/components/ItemShop";
import { UpgradesPanel } from "@/components/UpgradesPanel";
import { PrestigePanel } from "@/components/PrestigePanel";
import { DailyReward } from "@/components/DailyReward";
import { AchievementsList } from "@/components/AchievementsList";
import { CelestialPanel } from "@/components/CelestialPanel";

type DockTab = "game" | "shop" | "upgrades" | "prestige" | "celestial" | "profile" | "top";

export function TapGame() {
  const [initData, setInitData] = useState("");
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [loading, setLoading] = useState(true);
  const [dockTab, setDockTab] = useState<DockTab>("game");
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [lbLoading, setLbLoading] = useState(false);
  const [publicBotUsername, setPublicBotUsername] = useState<string | null>(null);

  // Загрузка initData
  useEffect(() => {
    return watchTelegramInitData((raw) => {
      setInitData(raw);
    });
  }, []);

  // Навигация по вкладкам
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tab = dockTabFromHash() as DockTab;
    setDockTab(tab === "profile" ? "profile" : tab === "top" ? "top" : tab === "game" ? "game" : "game");

    const onHash = () => {
      const newTab = dockTabFromHash() as DockTab;
      setDockTab(newTab === "profile" ? "profile" : newTab === "top" ? "top" : "game");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const goTab = useCallback((t: DockTab) => {
    setDockTab(t);
    const path = window.location.pathname + window.location.search;
    window.history.replaceState(null, "", historyUrlForDockTab(path, t as any));
  }, []);

  // Загрузка данных игрока
  const loadState = useCallback(async () => {
    if (!initData) return;
    setLoading(true);
    try {
      const state = await fetchFullState(initData);
      setPlayerState(state);
    } catch (error) {
      console.error("Failed to load state:", error);
    } finally {
      setLoading(false);
    }
  }, [initData]);

  useEffect(() => {
    if (initData) {
      loadState();
    }
  }, [initData, loadState]);

  // Загрузка лидерборда
  useEffect(() => {
    if (dockTab !== "top" || !initData) return;
    let cancelled = false;
    const loadLb = async () => {
      setLbLoading(true);
      try {
        const res = await fetch("/api/leaderboard/?limit=20", {
          headers: { "X-Telegram-Init-Data": initData },
        });
        const data = await res.json();
        if (!cancelled) setLeaderboard(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLbLoading(false);
      }
    };
    loadLb();
    return () => { cancelled = true; };
  }, [dockTab, initData]);

  const handleSync = (newPlayer: PlayerState["player"], incomePerSecond: number, _clickMultiplier?: number) => {
    if (playerState) {
      setPlayerState({
        ...playerState,
        player: newPlayer,
        income_per_second: incomePerSecond,
      });
    }
  };

  const handlePurchase = (newState: PlayerState) => {
    setPlayerState(newState);
  };

  const handlePrestige = (newState: PlayerState) => {
    setPlayerState(newState);
    // Переключаем на вкладку игры после закалки
    goTab("game");
  };

  const handleDailyReward = (coins: number, crystals: number) => {
    if (playerState) {
      setPlayerState({
        ...playerState,
        player: {
          ...playerState.player,
          coins: playerState.player.coins + coins,
          crystals: playerState.player.crystals + crystals,
        },
      });
    }
  };

  const twa = typeof window !== "undefined" ? getTelegramWebApp() : undefined;
  const tgUser = (twa?.initDataUnsafe?.user ?? {}) as { id?: number; first_name?: string; username?: string; photo_url?: string };

  if (!initData || loading || !playerState) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent mx-auto" />
          <p className="text-zinc-500">Загрузка...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (dockTab) {
      case "game":
        return (
          <SimpleTapGame
            initData={initData}
            playerState={playerState}
            onSync={handleSync}
          />
        );
      case "shop":
        return (
          <ItemShop
            initData={initData}
            playerState={playerState}
            onPurchase={handlePurchase}
          />
        );
      case "upgrades":
        return (
          <UpgradesPanel
            initData={initData}
            playerState={playerState}
            onPurchase={handlePurchase}
          />
        );
      case "prestige":
        return (
          <PrestigePanel
            initData={initData}
            playerState={playerState}
            onPrestige={handlePrestige}
          />
        );
      case "celestial":
        return (
          <CelestialPanel
            initData={initData}
            playerState={playerState}
            onUpdate={handlePurchase}
          />
        );
      case "profile":
        return (
          <div className="flex flex-col gap-4 p-3">
            <div className="rounded-2xl border border-violet-500/20 bg-black/40 p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                {tgUser.photo_url ? (
                  <img
                    src={tgUser.photo_url}
                    alt=""
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-violet-500/35"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-600/35 text-lg font-semibold text-violet-200">
                    {(playerState.player.first_name?.[0] || tgUser.first_name?.[0] || "?")}
                  </div>
                )}
                <div>
                  <p className="font-medium text-white">
                    {playerState.player.first_name || tgUser.first_name || "Игрок"}
                  </p>
                  {(tgUser.username || playerState.player.username) && (
                    <p className="text-xs text-zinc-500">
                      @{(playerState.player.username || tgUser.username || "").replace(/^@/, "")}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <DailyReward initData={initData} onUpdate={handleDailyReward} />
            <AchievementsList initData={initData} playerState={playerState} onReward={handleDailyReward} />
          </div>
        );
      case "top":
        return (
          <div className="flex flex-col gap-3 p-3">
            {lbLoading && <p className="text-center text-zinc-500">Загрузка рейтинга...</p>}
            {leaderboard && (
              <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
                {leaderboard.results.map((row: any, idx: number) => (
                  <div
                    key={row.telegram_id}
                    className={`flex items-center gap-3 border-b border-white/5 py-2 last:border-0 ${
                      row.telegram_id === tgUser.id ? "bg-violet-500/10 rounded-lg px-2" : ""
                    }`}
                  >
                    <span className="w-8 text-center text-sm text-zinc-500">{idx + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm text-white">{row.first_name || row.username || "Игрок"}</p>
                      <p className="text-xs text-zinc-500">{row.total_taps.toLocaleString("ru-RU")} тапов</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-cyan-400">{row.coins.toLocaleString("ru-RU")} 💰</p>
                    </div>
                  </div>
                ))}
                {leaderboard.me_rank && !leaderboard.results.some((r: any) => r.telegram_id === tgUser.id) && (
                  <p className="mt-3 text-center text-xs text-zinc-500">
                    Ваше место: #{leaderboard.me_rank}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-dvh w-full flex-col">
      {/* Верхняя панель с балансом */}
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

      {/* Основной контент */}
      <div className="flex-1 pb-20">
        {renderContent()}
      </div>

      {/* Нижняя навигация */}
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
              onClick={() => goTab(tab.id as DockTab)}
              className={`tap-target flex flex-col items-center px-3 py-1 transition ${
                dockTab === tab.id
                  ? "text-cyan-400"
                  : "text-zinc-500 hover:text-zinc-300"
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
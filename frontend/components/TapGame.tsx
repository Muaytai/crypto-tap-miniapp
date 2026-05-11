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
import { CryptoTipBanner } from "@/components/CryptoTipBanner";

type DockTab = "game" | "shop" | "upgrades" | "prestige" | "profile" | "top";

// Названия кнопок под референс
const TAB_LABELS: Record<DockTab, { label: string; icon: string }> = {
  game: { label: "Капля", icon: "💧" },
  shop: { label: "Лаба", icon: "🔬" },
  upgrades: { label: "Антр.", icon: "⚡" },
  prestige: { label: "Закал.", icon: "🔥" },
  celestial: { label: "Неб.", icon: "🌌" },
  profile: { label: "Цели", icon: "🎯" },
  top: { label: "Топ", icon: "🏆" },
};

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
    const allowedTabs: DockTab[] = ["game", "shop", "upgrades", "prestige", "profile", "top"];
    setDockTab(allowedTabs.includes(tab) ? tab : "game");

    const onHash = () => {
      const newTab = dockTabFromHash() as DockTab;
      setDockTab(allowedTabs.includes(newTab) ? newTab : "game");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const goTab = useCallback((t: DockTab) => {
    // Если нажали на уже активную вкладку — закрываем её (возвращаемся на game)
    if (t === dockTab && t !== "game") {
      setDockTab("game");
      const path = window.location.pathname + window.location.search;
      window.history.replaceState(null, "", historyUrlForDockTab(path, "game"));
    } else {
      setDockTab(t);
      const path = window.location.pathname + window.location.search;
      window.history.replaceState(null, "", historyUrlForDockTab(path, t as any));
    }
  }, [dockTab]);

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
    setDockTab("game");
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
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          <p className="text-zinc-500">Загрузка...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (dockTab) {
      case "game":
        return (
          <>
            <div className="flex-1">
              <SimpleTapGame
                initData={initData}
                playerState={playerState}
                onSync={handleSync}
              />
            </div>
            <CryptoTipBanner />
          </>
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
          </div>
        );
      case "top":
        return (
          <div className="flex-1 pb-20">
            <div className="flex flex-col gap-3 p-4">
              <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                <h3 className="mb-3 text-lg font-semibold text-white">🏆 Топ игроков</h3>
                {lbLoading && <p className="text-center text-zinc-500">Загрузка рейтинга...</p>}
                {leaderboard && (
                  <div className="space-y-2">
                    {leaderboard.results.map((row: any, idx: number) => (
                      <div
                        key={row.telegram_id}
                        className={`flex items-center justify-between rounded-lg p-2 ${
                          row.telegram_id === tgUser.id ? "bg-violet-500/20" : "bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-sm font-bold text-zinc-500">#{idx + 1}</span>
                          <span className="text-white">{row.first_name || row.username || "Игрок"}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-cyan-400">{row.total_taps.toLocaleString()} тапов</p>
                          <p className="text-xs text-zinc-500">{row.coins.toLocaleString()} 💰</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-dvh w-full flex-col bg-black">
      {/* Верхняя панель с балансом */}
      <div className="sticky top-0 z-10 border-b border-amber-800/30 bg-black/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💎</span>
            <div>
              <p className="font-pixel text-[10px] text-amber-500/80">ХЕШ/СЕК</p>
              <p className="font-pixel text-lg font-bold text-cyan-400">
                {Math.floor(playerState.income_per_second).toLocaleString("ru-RU")}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-pixel text-[10px] text-amber-500/80">БАЛАНС</p>
            <p className="font-pixel text-lg font-bold text-amber-300">
              {Math.floor(playerState.player.coins).toLocaleString("ru-RU")}
            </p>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      {renderContent()}

      {/* Нижняя навигация в стиле капли Руперта */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-amber-800/30 bg-black/95 backdrop-blur-md">
        <div className="flex justify-around py-2">
          {[
            { id: "shop", label: "Лаба", icon: "🔬" },
            { id: "upgrades", label: "Антр.", icon: "⚡" },
            { id: "game", label: "Капля", icon: "💧" },
            { id: "profile", label: "Цели", icon: "🎯" },
            { id: "prestige", label: "Закал.", icon: "🔥" },
            { id: "top", label: "Топ", icon: "🏆" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => goTab(tab.id as DockTab)}
              className={`tap-target flex flex-col items-center px-3 py-1 transition-all ${
                dockTab === tab.id
                  ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="font-pixel text-[9px] uppercase tracking-wide">
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
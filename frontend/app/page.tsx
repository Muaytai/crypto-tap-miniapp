"use client";

/**
 * Вкладки как в референсе: Лаба (магазин), Апгр. (улучшения), Цели, Эвол., Топ.
 * По умолчанию — главная страница с тапалкой (activeTab === null).
 * Повторное нажатие на активную кнопку закрывает меню.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { DailyReward } from "@/components/DailyReward";
import { AchievementsList } from "@/components/AchievementsList";
import { RoomScene } from "@/components/RoomScene";
import { ItemShop } from "@/components/ItemShop";
import { UpgradesPanel } from "@/components/UpgradesPanel";
import { DailyRewardModal } from "@/components/DailyRewardModal";
import { SettingsModal } from "@/components/SettingsModal";
import { GoalsTabPanel } from "@/components/GoalsTabPanel";
import { PrestigePanel } from "@/components/PrestigePanel";
import { LeaderboardPanel } from "@/components/LeaderboardPanel";
import { CryptoTipBanner } from "@/components/CryptoTipBanner";
import { MobileAppFrame } from "@/components/MobileAppFrame";
import { DynamicBackground } from "@/components/DynamicBackground";
import { fetchDailyRewardStatus, fetchFullState, syncTaps, type PlayerState } from "@/lib/api";
import { watchTelegramInitData } from "@/lib/telegram";

type DockTab = "lab" | "upgrades" | "goals" | "prestige" | "top";

const DOCK: { id: DockTab; label: string; title: string }[] = [
  { id: "lab", label: "🔧", title: "Магазин" },
  { id: "upgrades", label: "🚀", title: "Улучшения" },
  { id: "goals", label: "🏆", title: "Достижения" },
  { id: "prestige", label: "💎", title: "Начать заново" },
  { id: "top", label: "🥇", title: "Топ" },
];

function GameHeader({ playerState }: { playerState: PlayerState }) {
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur-md px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top,0px))]">
      <div className="flex w-full items-center justify-between gap-2 font-pixel text-[10px] text-white/80 sm:text-[11px]">
        <div className="flex items-center gap-1">
          <span aria-hidden>₿</span>
          <span className="tabular-nums font-bold text-cyan-400">
            {Math.floor(playerState.player.coins).toLocaleString("ru-RU")}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span aria-hidden>⚡</span>
          <span className="tabular-nums text-white/70">{playerState.income_per_second} х/с</span>
        </div>
        <div className="flex items-center gap-1">
          <span aria-hidden>💎</span>
          <span className="tabular-nums text-purple-400">{playerState.player.crystals}</span>
        </div>
      </div>
    </header>
  );
}

function LabTopBar(props: {
  onOpenDaily: () => void;
  onOpenSettings: () => void;
  showDailyBadge?: boolean;
}) {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black/70 px-2 py-2 pt-[max(0.35rem,env(safe-area-inset-top,0px))] backdrop-blur-md">
      <span className="pl-1 font-pixel text-[10px] font-bold uppercase tracking-wider text-white/80">
        Crypto Tap
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={props.onOpenDaily}
          className="tap-target relative rounded-md border border-white/20 bg-white/10 px-2 py-1 font-pixel text-[11px] text-white/80 hover:bg-white/20"
        >
          <span aria-hidden>📅</span>
          {props.showDailyBadge ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-sm bg-cyan-500 px-0.5 text-[9px] leading-none text-white">
              1
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={props.onOpenSettings}
          className="tap-target rounded-md border border-white/20 bg-white/10 px-2 py-1 font-pixel text-[11px] text-white/80 hover:bg-white/20"
        >
          ⚙
        </button>
      </div>
    </div>
  );
}

function BottomDock(props: { active: DockTab | null; onChange: (t: DockTab) => void }) {
  const icons: Record<DockTab, string> = {
    lab: "/icons/lab.svg",
    upgrades: "/icons/upgrades.svg",
    goals: "/icons/goals.svg",
    prestige: "/icons/prestige.svg",
    top: "/icons/top.svg",
  };

  const labels: Record<DockTab, string> = {
    lab: "Магазин",
    upgrades: "Улучшения",
    goals: "Достижения",
    prestige: "Начать заново",
    top: "Топ",
  };

  const getIconClass = (tabId: DockTab, isActive: boolean): string => {
    if (!isActive) return "nav-icon opacity-70";
    switch (tabId) {
      case "lab": return "nav-icon-lab-active";
      case "upgrades": return "nav-icon-upgrades-active";
      case "goals": return "nav-icon-goals-active";
      case "prestige": return "nav-icon-prestige-active";
      case "top": return "nav-icon-top-active";
      default: return "nav-icon-active";
    }
  };

  const getTextClass = (tabId: DockTab, isActive: boolean): string => {
    if (!isActive) return "text-white/40";
    switch (tabId) {
      case "lab": return "text-cyan-400 drop-shadow-[0_0_6px_#06b6d4]";
      case "upgrades": return "text-violet-400 drop-shadow-[0_0_6px_#8b5cf6]";
      case "goals": return "text-blue-400 drop-shadow-[0_0_6px_#3b82f6]";
      case "prestige": return "text-fuchsia-400 drop-shadow-[0_0_6px_#d946ef]";
      case "top": return "text-cyan-400 drop-shadow-[0_0_6px_#06b6d4]";
      default: return "text-white";
    }
  };

  return (
    <nav className="z-30 shrink-0 border-t border-white/10 bg-black/70 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex justify-between gap-0.5 px-1 py-2">
        {DOCK.map((tab) => {
          const on = props.active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => props.onChange(tab.id)}
              className={`tap-target flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-1 py-2 transition-all duration-200 ${
                on
                  ? "bg-white/15 shadow-lg scale-105"
                  : "hover:bg-white/10 hover:scale-105"
              }`}
            >
              <img
                src={icons[tab.id]}
                alt={labels[tab.id]}
                className={`h-6 w-6 transition-all duration-200 ${getIconClass(tab.id, on)}`}
              />
              <span
                className={`font-pixel text-[9px] uppercase tracking-wide transition-all duration-200 ${getTextClass(tab.id, on)}`}
              >
                {labels[tab.id]}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default function Home() {
  const [initData, setInitData] = useState("");
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DockTab | null>(null);
  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [dailyClaimable, setDailyClaimable] = useState(false);

  // Тапы
  const [clickMultiplier, setClickMultiplier] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const pendingTapsRef = useRef(0);

  useEffect(() => {
    return watchTelegramInitData((raw) => {
      setInitData(raw);
    });
  }, []);

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
    void loadState();
  }, [initData]);

  // Обновляем множитель кликов из улучшений
  useEffect(() => {
    if (!playerState) return;
    if (!initData || initData === "dev") {
      const purchasedClickUpgrade = playerState.available_upgrades.find(
        u => u.upgrade_type === "click_multiplier" &&
        playerState.upgrades.some(pu => pu.upgrade_id === u.id)
      );
      setClickMultiplier(purchasedClickUpgrade?.value || 1);
    }
  }, [playerState, initData]);

  // Глобальный таймер для пассивного дохода
  useEffect(() => {
    if (!playerState) return;
    if (playerState.income_per_second === 0) return;

    const interval = setInterval(() => {
      setPlayerState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          player: {
            ...prev.player,
            coins: prev.player.coins + prev.income_per_second,
            total_earned_all_time: prev.player.total_earned_all_time + prev.income_per_second,
          },
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [playerState?.income_per_second]);

  useEffect(() => {
    if (!initData || !playerState) return;
    void fetchDailyRewardStatus(initData)
      .then((s) => setDailyClaimable(s.can_claim))
      .catch(() => setDailyClaimable(false));
  }, [initData, playerState, activeTab]);

  const handleTabChange = (tabId: DockTab) => {
    if (activeTab === tabId) {
      setActiveTab(null);
    } else {
      setActiveTab(tabId);
    }
  };

  const handleIncomeChange = (newIncome: number) => {
    if (playerState) {
      setPlayerState({
        ...playerState,
        income_per_second: newIncome,
      });
    }
  };

  const handleComponentUpgrade = (itemId: number, delta: number) => {
    if (!playerState) return;

    const item = playerState.available_items.find(i => i.id === itemId);
    if (!item) return;

    const currentItem = playerState.items.find(i => i.item_id === itemId);
    const currentLevel = currentItem?.level || 1;

    const newLevel = Math.min(10, Math.max(1, currentLevel + delta));
    if (newLevel === currentLevel) return;

    const updatedItems = [...playerState.items];
    const existingIndex = updatedItems.findIndex(i => i.item_id === itemId);
    const simulatedQuantity = newLevel * 10;

    if (existingIndex >= 0) {
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        level: newLevel,
        quantity: simulatedQuantity
      };
    } else {
      updatedItems.push({
        item_id: itemId,
        item_name: item.name,
        item_icon: item.icon_name || "",
        quantity: simulatedQuantity,
        level: newLevel,
        item_base_income: item.base_income_per_second,
        item_base_price: item.base_price,
      });
    }

    setPlayerState({ ...playerState, items: updatedItems });
  };

  const handleTap = useCallback(() => {
    pendingTapsRef.current += 1;
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 160);

    if (playerState) {
      setPlayerState(prev => prev ? {
        ...prev,
        player: {
          ...prev.player,
          coins: prev.player.coins + clickMultiplier
        }
      } : null);
    }

    if (initData && initData !== "dev") {
      syncTaps(initData, 1, 0).catch(console.error);
    }
  }, [clickMultiplier, playerState, initData]);

  if (!initData) {
    return <DevHome />;
  }

  if (loading || !playerState) {
    return (
      <MobileAppFrame>
        <div className="flex flex-1 items-center justify-center bg-[#070b14]">
          <div className="text-center font-pixel text-white/80">
            <div className="mx-auto mb-3 h-8 w-8 animate-pulse border-2 border-cyan-500 bg-cyan-500/20" />
            <p className="text-xs">Загрузка...</p>
          </div>
        </div>
      </MobileAppFrame>
    );
  }

  const handleSync = (
    newPlayer: PlayerState["player"],
    incomePerSecond: number,
    _clickMul?: number,
  ) => {
    setPlayerState((prev) =>
      prev
        ? {
            ...prev,
            player: newPlayer,
            income_per_second: incomePerSecond,
          }
        : null,
    );
  };

  const handlePurchase = (newState: PlayerState) => {
    setPlayerState(newState);
  };

  const handlePrestige = (newState: PlayerState) => {
    setPlayerState(newState);
    setActiveTab(null);
  };

  const handleDailyReward = (coins: number, crystals: number) => {
    setPlayerState((prev) =>
      prev
        ? {
            ...prev,
            player: {
              ...prev.player,
              coins: prev.player.coins + coins,
              crystals: prev.player.crystals + crystals,
            },
          }
        : null,
    );
  };

  const renderContent = () => {
    if (activeTab === null) {
      return (
        <DynamicBackground
          incomePerSecond={playerState.income_per_second}
          isDev={!initData}
          onIncomeChange={handleIncomeChange}
          onComponentUpgrade={handleComponentUpgrade}
          playerState={playerState}
        >
          <div className="relative flex h-full flex-col">
            <LabTopBar
              onOpenDaily={() => setDailyModalOpen(true)}
              onOpenSettings={() => setSettingsModalOpen(true)}
              showDailyBadge={dailyClaimable}
            />
            <div className="relative flex flex-1 flex-col">
              <div className="px-2 pt-2">
                <CryptoTipBanner
                  seed={playerState.player.telegram_id}
                  className="border-white/10 bg-transparent px-1 py-1.5 shadow-none"
                />
              </div>
              <RoomScene
                playerState={playerState}
                onTap={handleTap}
                clickMultiplier={clickMultiplier}
                isAnimating={isAnimating}
              />
            </div>
          </div>
        </DynamicBackground>
      );
    }

    switch (activeTab) {
      case "lab":
        return (
          <div className="h-full w-full overflow-y-auto">
            <ItemShop initData={initData} playerState={playerState} onPurchase={handlePurchase} />
          </div>
        );
      case "upgrades":
        return (
          <div className="h-full w-full overflow-y-auto bg-[#0f0c0a]">
            <UpgradesPanel initData={initData} playerState={playerState} onPurchase={handlePurchase} />
          </div>
        );
      case "goals":
        return (
          <div className="h-full w-full overflow-y-auto bg-[#0f141b] px-3 pb-3 pt-3">
            <h1 className="text-center font-pixel text-2xl text-[#f6cd2d]">Цели</h1>
            <p className="text-center font-pixel text-[10px] text-[#9da9b8]">Награды и достижения</p>
            <DailyReward initData={initData} onUpdate={handleDailyReward} />
            <AchievementsList initData={initData} playerState={playerState} onReward={handleDailyReward} />
          </div>
        );
      case "prestige":
        return (
          <div className="h-full w-full overflow-y-auto p-3 pb-6">
            <PrestigePanel
              initData={initData}
              playerState={playerState}
              onPrestige={handlePrestige}
              onUpdate={handlePurchase}
            />
          </div>
        );
      case "top":
        return (
          <div className="h-full w-full overflow-y-auto">
            <LeaderboardPanel initData={initData} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <MobileAppFrame>
      <div
        className={`flex h-full flex-col overflow-hidden ${
          activeTab === null || activeTab === "lab" || activeTab === "upgrades"
            ? "bg-[#070b14]"
            : "bg-[#2a2319]"
        }`}
      >
        <GameHeader playerState={playerState} />
        <div className="flex-1 min-h-0 overflow-hidden">
          {renderContent()}
        </div>
        <BottomDock active={activeTab} onChange={handleTabChange} />
        {playerState && (
          <DailyRewardModal
            open={dailyModalOpen}
            onClose={() => setDailyModalOpen(false)}
            initData={initData}
            onClaimed={(coins, crystals) => {
              handleDailyReward(coins, crystals);
              setDailyClaimable(false);
            }}
            onStatusChange={setDailyClaimable}
          />
        )}
        <SettingsModal open={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
      </div>
    </MobileAppFrame>
  );
}

// DevHome
function DevHome() {
  const [playerState, setPlayerState] = useState<PlayerState>({
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
      { id: 1, name: "Диван", base_income_per_second: 2, base_price: 100, icon_name: "sofa" },
      { id: 2, name: "Стол", base_income_per_second: 3, base_price: 150, icon_name: "desk" },
      { id: 3, name: "Ноутбук", base_income_per_second: 4, base_price: 200, icon_name: "laptop" },
      { id: 4, name: "Стул", base_income_per_second: 1, base_price: 50, icon_name: "chair" },
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
    ],
    income_per_second: 10,
  });
  const [activeTab, setActiveTab] = useState<DockTab | null>(null);
  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [dailyClaimable, setDailyClaimable] = useState(false);

  const [clickMultiplier, setClickMultiplier] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const pendingTapsRef = useRef(0);

  useEffect(() => {
    if (playerState.income_per_second === 0) return;

    const interval = setInterval(() => {
      setPlayerState(prev => ({
        ...prev,
        player: {
          ...prev.player,
          coins: prev.player.coins + prev.income_per_second,
        },
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [playerState.income_per_second]);

  useEffect(() => {
    void fetchDailyRewardStatus("dev")
      .then((s) => setDailyClaimable(s.can_claim))
      .catch(() => setDailyClaimable(false));
  }, [activeTab]);

  useEffect(() => {
    const purchasedClickUpgrade = playerState.available_upgrades.find(
      u => u.upgrade_type === "click_multiplier" &&
      playerState.upgrades.some(pu => pu.upgrade_id === u.id)
    );
    setClickMultiplier(purchasedClickUpgrade?.value || 1);
  }, [playerState]);

  const handleTabChangeDev = (tabId: DockTab) => {
    if (activeTab === tabId) {
      setActiveTab(null);
    } else {
      setActiveTab(tabId);
    }
  };

  const handleSync = (newPlayer: PlayerState["player"], incomePerSecond: number) => {
    setPlayerState(prev => ({
      ...prev,
      player: { ...prev.player, ...newPlayer },
      income_per_second: incomePerSecond,
    }));
  };

  const handlePurchase = (newState: PlayerState) => setPlayerState(newState);
  const handlePrestige = (newState: PlayerState) => {
    setPlayerState(newState);
    setActiveTab(null);
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

  const handleIncomeChangeDev = (newIncome: number) => {
    setPlayerState(prev => ({
      ...prev,
      income_per_second: newIncome,
    }));
  };

  const handleComponentUpgradeDev = (itemId: number, delta: number) => {
    const item = playerState.available_items.find(i => i.id === itemId);
    if (!item) return;

    const currentItem = playerState.items.find(i => i.item_id === itemId);
    const currentLevel = currentItem?.level || 1;

    const newLevel = Math.min(10, Math.max(1, currentLevel + delta));
    if (newLevel === currentLevel) return;

    const updatedItems = [...playerState.items];
    const existingIndex = updatedItems.findIndex(i => i.item_id === itemId);
    const simulatedQuantity = newLevel * 10;

    if (existingIndex >= 0) {
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        level: newLevel,
        quantity: simulatedQuantity
      };
    } else {
      updatedItems.push({
        item_id: itemId,
        item_name: item.name,
        item_icon: item.icon_name || "",
        quantity: simulatedQuantity,
        level: newLevel,
        item_base_income: item.base_income_per_second,
        item_base_price: item.base_price,
      });
    }

    setPlayerState({ ...playerState, items: updatedItems });
  };

  const handleTapDev = useCallback(() => {
    pendingTapsRef.current += 1;
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 160);

    if (playerState) {
      setPlayerState(prev => ({
        ...prev,
        player: {
          ...prev.player,
          coins: prev.player.coins + clickMultiplier
        }
      }));
    }
  }, [clickMultiplier, playerState]);

  const renderContent = () => {
    if (activeTab === null) {
      return (
        <DynamicBackground
          incomePerSecond={playerState.income_per_second}
          isDev={true}
          onIncomeChange={handleIncomeChangeDev}
          onComponentUpgrade={handleComponentUpgradeDev}
          playerState={playerState}
        >
          <div className="flex h-full flex-col">
            <LabTopBar
              onOpenDaily={() => setDailyModalOpen(true)}
              onOpenSettings={() => setSettingsModalOpen(true)}
              showDailyBadge={dailyClaimable}
            />
            <div className="flex flex-1 flex-col">
              <div className="px-2 pt-2">
                <CryptoTipBanner seed={777} className="border-white/10 bg-transparent px-1 py-1.5 shadow-none" />
              </div>
              <RoomScene
                playerState={playerState}
                onTap={handleTapDev}
                clickMultiplier={clickMultiplier}
                isAnimating={isAnimating}
              />
            </div>
          </div>
        </DynamicBackground>
      );
    }

    switch (activeTab) {
      case "lab":
        return (
          <div className="h-full w-full overflow-y-auto">
            <ItemShop initData="dev" playerState={playerState} onPurchase={handlePurchase} />
          </div>
        );
      case "upgrades":
        return (
          <div className="h-full w-full overflow-y-auto bg-[#0f0c0a]">
            <UpgradesPanel initData="dev" playerState={playerState} onPurchase={handlePurchase} />
          </div>
        );
      case "goals":
        return (
          <div className="h-full w-full overflow-y-auto px-3 pt-3">
            <h1 className="text-center font-pixel text-lg text-white">Цели</h1>
            <DailyReward initData="dev" onUpdate={handleDailyReward} />
            <AchievementsList initData="dev" playerState={playerState} onReward={handleDailyReward} />
          </div>
        );
      case "prestige":
        return (
          <div className="h-full w-full overflow-y-auto p-3 pb-6">
            <PrestigePanel
              initData="dev"
              playerState={playerState}
              onPrestige={handlePrestige}
              onUpdate={handlePurchase}
            />
          </div>
        );
      case "top":
        return (
          <div className="h-full w-full overflow-y-auto">
            <LeaderboardPanel initData="dev" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <MobileAppFrame>
      <div
        className={`flex h-full flex-col overflow-hidden ${
          activeTab === "lab" || activeTab === "upgrades" || activeTab === "top"
            ? "bg-[#070b14]"
            : "bg-[#2a2319]"
        }`}
      >
        <GameHeader playerState={playerState} />
        <div className="flex-1 min-h-0 overflow-hidden">
          {renderContent()}
        </div>
        <BottomDock active={activeTab} onChange={handleTabChangeDev} />
        <DailyRewardModal
          open={dailyModalOpen}
          onClose={() => setDailyModalOpen(false)}
          initData="dev"
          onClaimed={(coins, crystals) => {
            handleDailyReward(coins, crystals);
            setDailyClaimable(false);
          }}
          onStatusChange={setDailyClaimable}
        />
        <SettingsModal open={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
      </div>
    </MobileAppFrame>
  );
}
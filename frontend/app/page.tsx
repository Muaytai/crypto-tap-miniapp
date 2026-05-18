"use client";

/**
 * Вкладки как в референсе: Лаба (магазин), Апгр. (улучшения), Цели, Закал., Топ.
 * По умолчанию — главная страница с тапалкой (activeTab === null).
 * Повторное нажатие на активную кнопку закрывает меню.
 */
import { useState, useEffect } from "react";
import { SimpleTapGame } from "@/components/SimpleTapGame";
import { ItemShop } from "@/components/ItemShop";
import { UpgradesPanel } from "@/components/UpgradesPanel";
import { DailyRewardModal } from "@/components/DailyRewardModal";
import { SettingsModal } from "@/components/SettingsModal";
import { GoalsTabPanel } from "@/components/GoalsTabPanel";
import { PrestigePanel } from "@/components/PrestigePanel";
import { LeaderboardPanel } from "@/components/LeaderboardPanel";
import { CryptoTipBanner } from "@/components/CryptoTipBanner";
import { MiningRoomBackground } from "@/components/MiningRoomBackground";
import { MobileAppFrame } from "@/components/MobileAppFrame";
import { fetchDailyRewardStatus, fetchFullState, type PlayerState } from "@/lib/api";
import { watchTelegramInitData } from "@/lib/telegram";

type DockTab = "lab" | "upgrades" | "goals" | "prestige" | "top";

const DOCK: { id: DockTab; label: string; title: string }[] = [
  { id: "lab", label: "🔧", title: "Лаба" },
  { id: "upgrades", label: "🚀", title: "Апгр." },
  { id: "goals", label: "🏆", title: "Цели" },
  { id: "prestige", label: "💎", title: "Закал." },
  { id: "top", label: "🥇", title: "Топ" },
];

function GameHeader({ playerState }: { playerState: PlayerState }) {
  return (
    <header className="sticky top-0 z-10 border-b-4 border-amber-900/70 bg-[#1a1410]/95 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top,0px))]">
      <div className="flex w-full items-center justify-between gap-2 font-pixel text-[10px] text-amber-100 sm:text-[11px]">
        <div className="flex items-center gap-1 text-cyan-200">
          <span aria-hidden>₿</span>
          <span className="tabular-nums font-bold">
            {Math.floor(playerState.player.coins).toLocaleString("ru-RU")}
          </span>
        </div>
        <div className="flex items-center gap-1 text-cyan-300/90">
          <span aria-hidden>⛏</span>
          <span className="tabular-nums">{playerState.income_per_second} х/с</span>
        </div>
        <div className="flex items-center gap-1 text-purple-300">
          <span aria-hidden>◆</span>
          <span className="tabular-nums">{playerState.player.crystals}</span>
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
    <div className="sticky top-0 z-20 flex items-center justify-between border-b border-amber-900/20 bg-[#0a0e14]/35 px-2 py-2 pt-[max(0.35rem,env(safe-area-inset-top,0px))] backdrop-blur-[8px]">
      <span className="pl-1 font-pixel text-[10px] font-bold uppercase tracking-wider text-amber-200/70">
        Crypto Tap
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={props.onOpenDaily}
          className="tap-target relative rounded-md border-2 border-amber-700/60 bg-[#120f0c] px-2 py-1 font-pixel text-[11px] text-amber-100"
        >
          <span aria-hidden>📅</span>
          {props.showDailyBadge ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-sm bg-sky-600 px-0.5 text-[9px] leading-none text-white">
              1
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={props.onOpenSettings}
          className="tap-target rounded-md border-2 border-zinc-600 bg-[#120f0c] px-2 py-1 font-pixel text-[11px] text-zinc-200"
        >
          ⚙
        </button>
      </div>
    </div>
  );
}

function BottomDock(props: { active: DockTab | null; onChange: (t: DockTab) => void }) {
  return (
    <nav className="z-30 shrink-0 border-t-4 border-amber-950 bg-[#14100c]/98 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex justify-between gap-0.5 px-1 py-2">
        {DOCK.map((tab) => {
          const on = props.active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => props.onChange(tab.id)}
              className={`tap-target flex min-w-0 flex-1 flex-col items-center rounded-md border-2 px-1 py-1 transition-colors ${
                on
                  ? "border-white bg-black/35 text-amber-50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]"
                  : "border-transparent text-amber-200/45 hover:text-amber-100/80"
              }`}
            >
              <span className="text-lg leading-none sm:text-xl">{tab.label}</span>
              <span className="font-pixel mt-0.5 max-w-[4.2rem] truncate text-[8px] leading-tight sm:text-[9px]">
                {tab.title}
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

  // Глобальный таймер для пассивного дохода — ЕДИНСТВЕННЫЙ источник
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
    // Если нажали на уже активную вкладку — закрываем её (возврат на главную)
    if (activeTab === tabId) {
      setActiveTab(null);
    } else {
      setActiveTab(tabId);
    }
  };

  if (!initData) {
    return <DevHome />;
  }

  if (loading || !playerState) {
    return (
      <MobileAppFrame>
        <div className="flex flex-1 items-center justify-center bg-[#070b14]">
          <div className="text-center font-pixel text-amber-200/80">
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
    setActiveTab(null); // после закалки возвращаемся на главную
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
        <div className="relative flex min-h-full flex-1 flex-col">
          <MiningRoomBackground />
          <div className="relative z-10 flex flex-col">
            <LabTopBar
              onOpenDaily={() => setDailyModalOpen(true)}
              onOpenSettings={() => setSettingsModalOpen(true)}
              showDailyBadge={dailyClaimable}
            />
            <div className="relative flex flex-col">
              <div className="px-2 pt-2">
                <CryptoTipBanner
                  seed={playerState.player.telegram_id}
                  className="border-amber-900/25 bg-transparent px-1 py-1.5 shadow-none"
                />
              </div>
              <SimpleTapGame initData={initData} playerState={playerState} onSync={handleSync} />
            </div>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "lab":
        return (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <ItemShop initData={initData} playerState={playerState} onPurchase={handlePurchase} />
          </div>
        );
      case "upgrades":
        return (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <UpgradesPanel initData={initData} playerState={playerState} onPurchase={handlePurchase} />
          </div>
        );
      case "goals":
        return (
          <GoalsTabPanel
            initData={initData}
            playerState={playerState}
            onReward={handleDailyReward}
          />
        );
      case "prestige":
        return (
          <div className="pb-2 [-webkit-overflow-scrolling:touch]">
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
          <div className="flex h-full min-h-0 flex-1 flex-col">
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
        className={`flex min-h-0 flex-1 flex-col overflow-hidden ${
          activeTab === null ||
          activeTab === "top" ||
          activeTab === "prestige"
            ? "bg-[#070b14]"
            : "bg-[#2a2319]"
        }`}
      >
        {activeTab !== "lab" && <GameHeader playerState={playerState} />}
        <div
          className={`h-full min-h-0 flex-1 ${
            activeTab === "top" || activeTab === "prestige" || activeTab === "goals"
              ? "overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:[scrollbar-width:thin] sm:[&::-webkit-scrollbar]:block sm:[&::-webkit-scrollbar]:w-1.5 sm:[&::-webkit-scrollbar-thumb]:rounded-full sm:[&::-webkit-scrollbar-thumb]:bg-amber-700/50"
              : "overflow-hidden"
          }`}
        >
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
      { id: 13, name: "GPU-риг", base_income_per_second: 1, base_price: 10, icon_name: "" },
      { id: 14, name: "ASIC-линия", base_income_per_second: 5, base_price: 50, icon_name: "" },
      { id: 15, name: "Блок питания Gold", base_income_per_second: 12, base_price: 120, icon_name: "" },
    ],
    available_upgrades: [
      {
        id: 12,
        name: "Закалённые руки",
        upgrade_type: "click_multiplier",
        value: 2.0,
        base_price: 500,
        min_total_taps: 0,
        icon_name: "",
      },
    ],
    income_per_second: 10,
  });
  const [activeTab, setActiveTab] = useState<DockTab | null>(null);
  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [dailyClaimable, setDailyClaimable] = useState(false);

  // Глобальный таймер для DEV
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

  const renderContent = () => {
    if (activeTab === null) {
      return (
        <div className="relative flex min-h-full flex-1 flex-col">
          <MiningRoomBackground />
          <div className="relative z-10 flex flex-col">
            <LabTopBar
              onOpenDaily={() => setDailyModalOpen(true)}
              onOpenSettings={() => setSettingsModalOpen(true)}
              showDailyBadge={dailyClaimable}
            />
            <div className="relative flex flex-col">
              <div className="px-2 pt-2">
                <CryptoTipBanner seed={777} className="border-amber-900/25 bg-transparent px-1 py-1.5 shadow-none" />
              </div>
              <SimpleTapGame initData="dev" playerState={playerState} onSync={handleSync} />
            </div>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "lab":
        return <div className="flex min-h-0 flex-1 flex-col overflow-hidden"><ItemShop initData="dev" playerState={playerState} onPurchase={handlePurchase} /></div>;
      case "upgrades":
        return <div className="flex min-h-0 flex-1 flex-col overflow-hidden"><UpgradesPanel initData="dev" playerState={playerState} onPurchase={handlePurchase} /></div>;
      case "goals":
        return (
          <GoalsTabPanel
            initData="dev"
            playerState={playerState}
            onReward={handleDailyReward}
            titleClassName="font-pixel text-lg text-amber-100 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]"
          />
        );
      case "prestige":
        return (
          <div className="pb-2 [-webkit-overflow-scrolling:touch]">
            <PrestigePanel
              initData="dev"
              playerState={playerState}
              onPrestige={handlePrestige}
              onUpdate={handlePurchase}
            />
          </div>
        );
      case "top":
        return <div className="flex min-h-0 flex-1 flex-col"><LeaderboardPanel initData="dev" /></div>;
      default:
        return null;
    }
  };

  return (
    <MobileAppFrame>
      <div
        className={`flex min-h-0 flex-1 flex-col overflow-hidden ${
          activeTab === "lab" || activeTab === "top" || activeTab === "prestige"
            ? "bg-[#070b14]"
            : "bg-[#2a2319]"
        }`}
      >
        {activeTab !== "lab" && <GameHeader playerState={playerState} />}
        <div
          className={`h-full min-h-0 flex-1 ${
            activeTab === "top" || activeTab === "prestige" || activeTab === "goals"
              ? "overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:[scrollbar-width:thin] sm:[&::-webkit-scrollbar]:block sm:[&::-webkit-scrollbar]:w-1.5 sm:[&::-webkit-scrollbar-thumb]:rounded-full sm:[&::-webkit-scrollbar-thumb]:bg-amber-700/50"
              : "overflow-hidden"
          }`}
        >
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

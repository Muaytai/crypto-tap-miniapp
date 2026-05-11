"use client";

/**
 * Вкладки как в референсе: Лаба (мастерская + тап), Апгр. (улучшения + магазин оборудования), Цели, Закал., Топ.
 * На экране «Лаба» HUD только по центру (см. SimpleTapGame), сверху — иконки как в референсе.
 */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { SimpleTapGame } from "@/components/SimpleTapGame";
import { UpgradesPanel } from "@/components/UpgradesPanel";
import { DailyReward } from "@/components/DailyReward";
import { DailyRewardModal } from "@/components/DailyRewardModal";
import { SettingsModal } from "@/components/SettingsModal";
import { AchievementsList } from "@/components/AchievementsList";
import { PrestigePanel } from "@/components/PrestigePanel";
import { CelestialPanel } from "@/components/CelestialPanel";
import { LeaderboardPanel } from "@/components/LeaderboardPanel";
import { CryptoTipBanner } from "@/components/CryptoTipBanner";
import { MiningRoomBackground } from "@/components/MiningRoomBackground";
import { MobileAppFrame } from "@/components/MobileAppFrame";
import { ThreeDotsMenu } from "@/components/ThreeDotsMenu";
import {
  fetchDailyRewardStatus,
  fetchFullState,
  type PlayerState,
} from "@/lib/api";
import { watchTelegramInitData } from "@/lib/telegram";

type DockTab = "lab" | "upgrades" | "goals" | "prestige" | "top";

const DOCK: { id: DockTab; label: string; title: string }[] = [
  { id: "lab", label: "🔧", title: "Лаба" },
  { id: "upgrades", label: "🚀", title: "Апгр." },
  { id: "goals", label: "🏆", title: "Цели" },
  { id: "prestige", label: "💎", title: "Закал." },
  { id: "top", label: "🎖", title: "Топ" },
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
          <span className="tabular-nums">
            {playerState.income_per_second} х/с
          </span>
        </div>

        <div className="flex items-center gap-1 text-purple-300">
          <span aria-hidden>◆</span>
          <span className="tabular-nums">
            {playerState.player.crystals}
          </span>
        </div>
      </div>
    </header>
  );
}

function LabTopBar(props: {
  onOpenDaily: () => void;
  onOpenSettings: () => void;
  showDailyBadge?: boolean;
  onReload?: () => void;
}) {
  const router = useRouter();
  const holdTimer = useRef<NodeJS.Timeout | null>(null);

  const startHold = () => {
    holdTimer.current = setTimeout(() => {
      router.push("/test");
    }, 1200);
  };

  const stopHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b border-amber-900/20 bg-[#0a0e14]/35 px-2 py-2 pt-[max(0.35rem,env(safe-area-inset-top,0px))] backdrop-blur-[8px]">
      {/* ЛОГО */}
      <button
        type="button"
        onMouseDown={startHold}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        onTouchStart={startHold}
        onTouchEnd={stopHold}
        className="pl-1 font-pixel text-[10px] font-bold uppercase tracking-wider text-amber-200/70 transition-transform active:scale-95"
      >
        Crypto Tap
      </button>

      {/* КНОПКИ - ТРИ ТОЧКИ В ПРАВОМ УГЛУ */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={props.onOpenDaily}
          className="tap-target relative rounded-md border-2 border-amber-700/60 bg-[#120f0c] px-2 py-1 font-pixel text-[11px] text-amber-100"
          aria-label="Ежедневная награда"
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
          aria-label="Настройки"
        >
          ⚙
        </button>

        {/* ТРИ ТОЧКИ - САМАЯ ПРАВАЯ КНОПКА */}
        <ThreeDotsMenu onReload={props.onReload} />
      </div>
    </div>
  );
}

function BottomDock(props: {
  active: DockTab;
  onChange: (t: DockTab) => void;
}) {
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
              <span className="text-lg leading-none sm:text-xl">
                {tab.label}
              </span>

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

  const [activeTab, setActiveTab] = useState<DockTab>("lab");

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

  useEffect(() => {
    if (!initData || !playerState) return;

    void fetchDailyRewardStatus(initData)
      .then((s) => setDailyClaimable(s.can_claim))
      .catch(() => setDailyClaimable(false));
  }, [initData, playerState, activeTab]);

  const handleReload = () => {
    window.location.reload();
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
            player: {
              ...prev.player,
              ...newPlayer,
            },
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
    setActiveTab("lab");
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
    switch (activeTab) {
      case "lab":
        return (
          <div className="relative flex min-h-full flex-1 flex-col">
            <MiningRoomBackground />

            <div className="relative z-10 flex flex-col">
              <LabTopBar
                onOpenDaily={() => setDailyModalOpen(true)}
                onOpenSettings={() => setSettingsModalOpen(true)}
                showDailyBadge={dailyClaimable}
                onReload={handleReload}
              />

              <div className="relative flex flex-col">
                <div className="px-2 pt-2">
                  <CryptoTipBanner
                    seed={playerState.player.telegram_id}
                    className="border-amber-900/25 bg-transparent px-1 py-1.5 shadow-none"
                  />
                </div>

                <SimpleTapGame
                  initData={initData}
                  playerState={playerState}
                  onSync={handleSync}
                />
              </div>
            </div>
          </div>
        );

      case "upgrades":
        return (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <UpgradesPanel
              initData={initData}
              playerState={playerState}
              onPurchase={handlePurchase}
            />
          </div>
        );

      case "goals":
        return (
          <div className="flex min-h-0 flex-1 flex-col gap-3 px-3 pt-3">
            <h1 className="text-center font-pixel text-lg text-amber-100">
              Цели
            </h1>

            <p className="text-center font-pixel text-[10px] text-amber-200/50">
              Награды и достижения
            </p>

            <DailyReward
              initData={initData}
              onUpdate={handleDailyReward}
            />

            <AchievementsList
              initData={initData}
              playerState={playerState}
              onReward={handleDailyReward}
            />
          </div>
        );

      case "prestige":
        return (
          <div className="flex min-h-0 flex-1 flex-col gap-4 p-3">
            <PrestigePanel
              initData={initData}
              playerState={playerState}
              onPrestige={handlePrestige}
            />

            <div className="border-2 border-violet-700/40 bg-[#0f0c14]/90 p-3">
              <p className="mb-2 font-pixel text-xs text-violet-200">
                Небесные апгрейды
              </p>

              <CelestialPanel
                initData={initData}
                playerState={playerState}
                onUpdate={handlePurchase}
              />
            </div>
          </div>
        );

      case "top":
        return (
          <div className="flex min-h-0 flex-1 flex-col">
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
          activeTab === "lab"
            ? "bg-[#070b14]"
            : "bg-[#2a2319]"
        }`}
      >
        {activeTab !== "lab" && (
          <GameHeader playerState={playerState} />
        )}

        <div className="min-h-0 flex-1 overflow-hidden">
          {renderContent()}
        </div>

        <BottomDock
          active={activeTab}
          onChange={setActiveTab}
        />

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

        <SettingsModal
          open={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
        />
      </div>
    </MobileAppFrame>
  );
}

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
      { id: 13, name: "GPU-риг", base_income_per_second: 1, base_price: 10 },
      { id: 14, name: "ASIC-линия", base_income_per_second: 5, base_price: 50 },
      { id: 15, name: "Блок питания Gold", base_income_per_second: 12, base_price: 120 },
    ],
    available_upgrades: [
      {
        id: 12,
        name: "Закалённые руки",
        upgrade_type: "click_multiplier",
        value: 2.0,
        base_price: 500,
        min_total_taps: 0,
      },
    ],
    income_per_second: 10,
  });
  const [activeTab, setActiveTab] = useState<DockTab>("lab");
  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [dailyClaimable, setDailyClaimable] = useState(false);

  useEffect(() => {
    void fetchDailyRewardStatus("dev")
      .then((s) => setDailyClaimable(s.can_claim))
      .catch(() => setDailyClaimable(false));
  }, [activeTab]);

  const handleSync = (newPlayer: PlayerState["player"], incomePerSecond: number) => {
    setPlayerState((prev) => ({
      ...prev,
      player: { ...prev.player, ...newPlayer },
      income_per_second: incomePerSecond,
    }));
  };

  const handlePurchase = (newState: PlayerState) => setPlayerState(newState);

  const handlePrestige = (newState: PlayerState) => {
    setPlayerState(newState);
    setActiveTab("lab");
  };

  const handleDailyReward = (coins: number, crystals: number) => {
    setPlayerState((prev) => ({
      ...prev,
      player: {
        ...prev.player,
        coins: prev.player.coins + coins,
        crystals: prev.player.crystals + crystals,
      },
    }));
  };

  const handleReload = () => {
    window.location.reload();
  };

  const renderContent = () => {
    switch (activeTab) {
      case "lab":
        return (
          <div className="relative flex min-h-full flex-1 flex-col">
            <MiningRoomBackground />
            <div className="relative z-10 flex flex-col">
              <LabTopBar
                onOpenDaily={() => setDailyModalOpen(true)}
                onOpenSettings={() => setSettingsModalOpen(true)}
                showDailyBadge={dailyClaimable}
                onReload={handleReload}
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
      case "upgrades":
        return (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <UpgradesPanel initData="dev" playerState={playerState} onPurchase={handlePurchase} />
          </div>
        );
      case "goals":
        return (
          <div className="flex min-h-0 flex-1 flex-col gap-3 px-3 pt-3">
            <h1 className="text-center font-pixel text-lg text-amber-100">Цели</h1>
            <DailyReward initData="dev" onUpdate={handleDailyReward} />
            <AchievementsList initData="dev" playerState={playerState} onReward={handleDailyReward} />
          </div>
        );
      case "prestige":
        return (
          <div className="flex min-h-0 flex-1 flex-col gap-4 p-3">
            <PrestigePanel initData="dev" playerState={playerState} onPrestige={handlePrestige} />
            <div className="border-2 border-violet-700/40 bg-[#0f0c14]/90 p-3">
              <p className="mb-2 font-pixel text-xs text-violet-200">Небесные апгрейды</p>
              <CelestialPanel initData="dev" playerState={playerState} onUpdate={handlePurchase} />
            </div>
          </div>
        );
      case "top":
        return (
          <div className="flex min-h-0 flex-1 flex-col">
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
        className={`flex min-h-0 flex-1 flex-col overflow-hidden ${activeTab === "lab" ? "bg-[#070b14]" : "bg-[#2a2319]"}`}
      >
        {activeTab !== "lab" && <GameHeader playerState={playerState} />}
        <div className="min-h-0 flex-1 overflow-hidden">{renderContent()}</div>
        <BottomDock active={activeTab} onChange={setActiveTab} />
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

"use client";

import { useState, useEffect } from "react";
import {
  performPrestige,
  getPrestigeStatus,
  fetchCelestialUpgrades,
  buyCelestialUpgrade,
  isLocalDevMock,
  type PlayerState,
} from "@/lib/api";
import { playGameSound } from "@/lib/gameSounds";

type Props = {
  initData: string;
  playerState: PlayerState;
  onPrestige: (newState: PlayerState) => void;
  onUpdate: (newState: PlayerState) => void;
};

type CelestialUpgrade = {
  id: number;
  name: string;
  description: string;
  upgrade_type: string;
  value: number;
  price_crystals: number;
  max_level: number;
};

type PlayerCelestial = {
  upgrade_id: number;
  level: number;
};

export function PrestigePanel({ initData, playerState, onPrestige, onUpdate }: Props) {
  const isDev = isLocalDevMock(initData);
  const [loading, setLoading] = useState(false);
  const [buyingUpgradeId, setBuyingUpgradeId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [upgrades, setUpgrades] = useState<CelestialUpgrade[]>([]);
  const [status, setStatus] = useState<any>(null);

  const getIcon = (type: string) => {
    switch (type) {
      case "global_income": return "🌍";
      case "tap_bonus": return "👆";
      case "offline_boost": return "⏰";
      case "auto_tap": return "🤖";
      default: return "💎";
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [statusData, upgradesData] = await Promise.all([
          getPrestigeStatus(initData),
          fetchCelestialUpgrades(initData),
        ]);
        setStatus(statusData);
        setUpgrades(upgradesData);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [initData]);

  const handlePrestige = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await performPrestige(initData);
      if (result.success) {
        const updated = {
          ...playerState,
          player: {
            ...playerState.player,
            coins: 0,
            crystals: result.total_crystals || playerState.player.crystals,
            prestige_count: result.prestige_count || playerState.player.prestige_count + 1,
            max_offline_minutes: 180,
          },
          items: [],
          upgrades: [],
          income_per_second: 0,
        };
        onPrestige(updated);
        setSuccess(`Закалка выполнена! +${result.crystals_earned || 0} 💎`);
        playGameSound("success");
      }
    } catch (err) {
      setError("Ошибка при перезакалке");
      playGameSound("error");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyCelestial = async (upgrade: CelestialUpgrade) => {
    setBuyingUpgradeId(upgrade.id);
    try {
      const result = await buyCelestialUpgrade(initData, upgrade.id);
      if (result.success) {
        onUpdate({
          ...playerState,
          player: { ...playerState.player, crystals: result.crystals_left },
        });
        setSuccess(`Куплено: ${upgrade.name}`);
        playGameSound("success");
      }
    } catch (err) {
      setError("Не удалось купить апгрейд");
      playGameSound("error");
    } finally {
      setBuyingUpgradeId(null);
    }
  };

  if (!status) {
    return <div className="flex h-full items-center justify-center text-cyan-400">Загрузка...</div>;
  }

  const progress = Math.min(100, (status.total_earned_all_time / status.prestige_threshold) * 100);
  const canPrestige = status.can_prestige;

  return (
    <div className="flex h-full flex-col bg-[#0c0614] px-4 pb-6 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-fuchsia-500/10 pb-4 pt-5">
        <h1 className="font-pixel text-center text-3xl font-bold tracking-[0.15em] text-fuchsia-400 drop-shadow-[0_0_20px_#e879f9]">
          ПЕРЕЗАКАЛКА
        </h1>
        <p className="mt-1 text-center font-mono text-xs text-fuchsia-500/70">
          Сбрось всё • Получи алмазы • Стань сильнее
        </p>
      </div>

      {isDev && (
        <div className="mt-4 rounded-2xl border border-fuchsia-400/30 bg-fuchsia-950/30 p-3 text-center text-xs text-fuchsia-400 backdrop-blur-md">
          ⚡ DEV MODE — локальные покупки
        </div>
      )}

      {error && <div className="mt-4 rounded-2xl bg-red-950/70 p-3 text-red-200 text-center">{error}</div>}
      {success && <div className="mt-4 rounded-2xl bg-emerald-950/70 p-3 text-emerald-300 text-center">{success}</div>}

      {/* Главная карточка */}
      <div className="mt-6 rounded-3xl border border-fuchsia-500/30 bg-gradient-to-br from-[#1a0b24] via-[#14081f] to-[#0c0614] p-6 shadow-2xl">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500/20 to-pink-500/10 text-6xl">
          💎
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white">ПЕРЕЗАКАЛКА</h2>
          <p className="text-sm text-fuchsia-400/80">Сброс прогресса ради вечных алмазов</p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs mb-1.5 text-zinc-400">
            <span>ПРОГРЕСС</span>
            <span>{status.total_earned_all_time.toLocaleString("ru-RU")}</span>
          </div>
          <div className="h-2.5 bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-fuchsia-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {canPrestige ? (
          <button
            onClick={handlePrestige}
            disabled={loading}
            className="tap-target w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-fuchsia-600 py-4 text-lg font-bold text-white shadow-xl shadow-fuchsia-600/50 hover:brightness-110 active:scale-[0.97] transition-all"
          >
            {loading ? "Выполняется..." : "СДЕЛАТЬ ПЕРЕЗАКАЛКУ"}
          </button>
        ) : (
          <div className="rounded-2xl bg-black/40 p-4 text-center text-sm text-zinc-400">
            Нужно ещё {(status.prestige_threshold - status.total_earned_all_time).toLocaleString("ru-RU")} кликов
          </div>
        )}
      </div>

      {/* Небесные апгрейды */}
      <div className="mt-8">
        <h3 className="mb-4 text-center font-pixel text-xl text-fuchsia-300">НЕБЕСНЫЕ АПГРЕЙДЫ</h3>
        <p className="mb-5 text-center text-xs text-fuchsia-400/60">Постоянные улучшения за алмазы</p>

        <div className="flex flex-col gap-3">
          {upgrades.map((upgrade) => {
            const price = upgrade.price_crystals;
            const canAfford = status.crystals >= price;

            return (
              <div
                key={upgrade.id}
                className="rounded-3xl border border-fuchsia-500/20 bg-gradient-to-br from-[#1a0b24] to-[#12071b] p-5 hover:border-fuchsia-400/40 transition-all"
              >
                <div className="flex gap-4">
                  <div className="text-4xl flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-500/10">
                    {getIcon(upgrade.upgrade_type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-lg">{upgrade.name}</h4>
                    <p className="text-sm text-zinc-400 mt-1">{upgrade.description}</p>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-fuchsia-300">
                        <span>💎</span>
                        <span className="font-mono font-semibold">{price}</span>
                      </div>
                      <button
                        onClick={() => handleBuyCelestial(upgrade)}
                        disabled={!canAfford || buyingUpgradeId === upgrade.id}
                        className={`tap-target px-7 py-2.5 rounded-2xl font-pixel text-sm font-bold transition-all ${
                          canAfford
                            ? "bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white hover:brightness-110 active:scale-95"
                            : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        }`}
                      >
                        {buyingUpgradeId === upgrade.id ? "..." : "КУПИТЬ"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
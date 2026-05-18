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
import {
  CelestialUpgradeCard,
  CrystalCost,
  getCelestialUpgradeIcon,
} from "@/components/CelestialUpgradeCard";

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
  icon_name?: string;
};

type PlayerCelestial = {
  upgrade_id: number;
  level: number;
};

/** Основной блок как «Рейтинг» во вкладке Топ */
const PRESTIGE_PAGE_CARD =
  "rounded-2xl border border-white/10 bg-gradient-to-b from-[#101626]/80 to-[#0b0f1a]/70 shadow-[0_18px_50px_-25px_rgba(0,0,0,0.85)]";

export function PrestigePanel({ initData, playerState, onPrestige, onUpdate }: Props) {
  const isDev = isLocalDevMock(initData);
  const [loading, setLoading] = useState(false);
  const [buyingUpgradeId, setBuyingUpgradeId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [upgrades, setUpgrades] = useState<CelestialUpgrade[]>([]);
  const [playerUpgrades, setPlayerUpgrades] = useState<Map<number, number>>(new Map());
  const [status, setStatus] = useState<{
    can_prestige: boolean;
    total_earned_all_time: number;
    prestige_threshold: number;
    current_prestige_count: number;
    crystals: number;
  } | null>(null);

  useEffect(() => {
    const loadStatusAndUpgrades = async () => {
      try {
        const [data, upgradesList] = await Promise.all([
          getPrestigeStatus(initData, isDev ? playerState.player : undefined),
          fetchCelestialUpgrades(initData),
        ]);
        setStatus(data);
        setUpgrades(upgradesList);
        try {
          const saved = localStorage.getItem(`celestial_${playerState.player.telegram_id}`);
          if (saved) {
            const parsed = JSON.parse(saved) as PlayerCelestial[];
            const map = new Map<number, number>();
            parsed.forEach((p) => map.set(p.upgrade_id, p.level));
            setPlayerUpgrades(map);
          }
        } catch {
          // localStorage is optional cache for levels until backend returns them in /state
        }
      } catch (err) {
        console.error("Failed to load prestige tab data:", err);
      }
    };
    loadStatusAndUpgrades();
  }, [initData, isDev, playerState.player.prestige_count, playerState.player.telegram_id]);

  const savePlayerUpgrades = (upgradeId: number, level: number) => {
    const newMap = new Map(playerUpgrades);
    newMap.set(upgradeId, level);
    setPlayerUpgrades(newMap);
    const arr = Array.from(newMap.entries()).map(([id, lvl]) => ({ upgrade_id: id, level: lvl }));
    localStorage.setItem(`celestial_${playerState.player.telegram_id}`, JSON.stringify(arr));
  };

  const handlePrestige = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await performPrestige(initData, isDev ? playerState.player : undefined);
      if (result.success) {
        // Обновляем состояние игрока (сброс)
        const updatedState = {
          ...playerState,
          player: {
            ...playerState.player,
            coins: 0,
            crystals: result.total_crystals,
            prestige_count: result.prestige_count,
          },
          items: playerState.items.map(item => ({ ...item, quantity: 0 })),
          upgrades: [],
          income_per_second: 0,
        };
        onPrestige(updatedState);
        setSuccess(`Закалка выполнена: +${result.crystals_earned.toLocaleString("ru-RU")} алмаз(ов)`);
        // Обновляем статус
        setStatus((prev) =>
          prev
            ? {
                ...prev,
                can_prestige: false,
                current_prestige_count: result.prestige_count,
                crystals: result.total_crystals,
              }
            : null,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка закалки");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyUpgrade = async (upgrade: CelestialUpgrade) => {
    const currentLevel = playerUpgrades.get(upgrade.id) || 0;
    const isMax = currentLevel >= upgrade.max_level;
    if (isMax) return;

    const price = upgrade.price_crystals * (currentLevel + 1);
    if (playerState.player.crystals < price) {
      setError(`Недостаточно алмазов: нужно ${price}, у вас ${playerState.player.crystals}`);
      return;
    }

    setBuyingUpgradeId(upgrade.id);
    setError(null);
    setSuccess(null);
    try {
      const result = isDev
        ? await buyCelestialUpgrade(initData, upgrade.id, {
            upgradeName: upgrade.name,
            nextLevel: currentLevel + 1,
            crystalsAfter: playerState.player.crystals - price,
          })
        : await buyCelestialUpgrade(initData, upgrade.id);
      if (result.success) {
        savePlayerUpgrades(upgrade.id, result.new_level);
        onUpdate({
          ...playerState,
          player: {
            ...playerState.player,
            crystals: result.crystals_left,
          },
        });
        setStatus((prev) => (prev ? { ...prev, crystals: result.crystals_left } : prev));
        setSuccess(`Куплен апгрейд "${upgrade.name}" до уровня ${result.new_level}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка покупки");
    } finally {
      setBuyingUpgradeId(null);
    }
  };

  if (!status) {
    return (
      <div className="bg-[#070b14] px-3 pb-1 pt-2">
        <div className={`${PRESTIGE_PAGE_CARD} px-3 py-16 text-center text-zinc-400`}>
          Загрузка...
        </div>
      </div>
    );
  }

  const PRESTIGE_STEP = 100_000_000_000;
  const progressPercent = Math.min(
    100,
    (status.total_earned_all_time / status.prestige_threshold) * 100
  );
  const needed = Math.max(0, status.prestige_threshold - status.total_earned_all_time);
  const potentialCrystals = status.can_prestige
    ? Math.max(1, Math.floor((status.total_earned_all_time - status.prestige_threshold) / PRESTIGE_STEP))
    : 0;

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-sm text-cyan-200">
        💡 Чем выше нагрузка, тем ценнее награда после перезакалки.
      </div>

          <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 to-orange-950/20 p-4">
        <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-wide text-amber-200">ПЕРЕЗАКАЛКА</h2>
              <p className="text-sm font-semibold text-cyan-300">💎 {status.crystals.toLocaleString("ru-RU")} АЛМАЗОВ</p>
            </div>

            <div className="rounded-2xl border border-amber-400/20 bg-black/30 p-4">
              <p className="text-center text-sm font-semibold uppercase tracking-wider text-amber-200">
                Алмазы закалки
              </p>
              <p className="mt-2 text-center text-4xl font-black text-cyan-300">
                💎 {status.crystals.toLocaleString("ru-RU")}
              </p>
              {status.can_prestige && potentialCrystals > 0 && (
                <p className="mt-2 text-center text-sm font-medium text-amber-200/90">
                  За эту перезакалку: +{potentialCrystals.toLocaleString("ru-RU")}
                </p>
              )}
              <p className="mt-2 text-center text-sm text-zinc-400">
                Перезакалок: {status.current_prestige_count} · Порог: {status.prestige_threshold.toLocaleString("ru-RU")}
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-base font-semibold text-zinc-200">
                {status.can_prestige ? "Перезакалка доступна" : "Перезакалка недоступна"}
              </p>
              {!status.can_prestige && (
                <p className="mt-1 text-sm text-zinc-400">
                  Заработай {status.prestige_threshold.toLocaleString("ru-RU")} кликов всего, чтобы открыть.
                </p>
              )}

              <div className="mt-2 flex justify-between text-sm text-zinc-400">
                <span>{status.total_earned_all_time.toLocaleString("ru-RU")}</span>
                <span>{status.prestige_threshold.toLocaleString("ru-RU")}</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-zinc-400">
                💡 Закалка сбрасывает весь прогресс, но даёт алмазы. Каждый алмаз даёт постоянные бонусы
                через небесные апгрейды.
              </p>
              {needed > 0 && (
                <p className="mt-1 text-xs text-zinc-500">
                  Осталось: {needed.toLocaleString("ru-RU")} кликов
                </p>
              )}
            </div>
          </div>

          {success && (
            <div className="rounded-xl bg-emerald-500/20 p-3 text-sm text-emerald-300">{success}</div>
          )}
          {error && <div className="rounded-xl bg-red-500/20 p-3 text-sm text-red-300">{error}</div>}

                    // Выбираем иконку по типу апгрейда
                    const getIcon = () => {
                      switch (upgrade.upgrade_type) {
                        case "tap_bonus": return "👆";
                        case "offline_boost": return "⏰";
                        case "auto_tap": return "⚙️";
                        case "global_income":
                        default: return "💎";
                      }
                    };

          <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/30 p-3">
            <p className="text-xs text-zinc-400">
              ⚡ После закалки вы получите алмазы, но потеряете все монеты, предметы и обычные улучшения.
              <br />
              💎 Алмазы и небесные апгрейды останутся с вами навсегда!
            </p>
          </div>

          <section className="flex flex-col gap-3">
            <div>
              <h3 className="text-lg font-bold tracking-wide text-white">НЕБЕСНЫЕ АПГРЕЙДЫ</h3>
              <p className="mt-1 text-sm text-zinc-400">
                Баланс:{" "}
                <CrystalCost amount={status.crystals} className="font-semibold text-cyan-300" />
              </p>
            </div>

            {upgrades.length > 0 ? (
              <div className="flex flex-col gap-3">
                {upgrades.map((upgrade) => {
                  const currentLevel = playerUpgrades.get(upgrade.id) || 0;
                  const isMax = currentLevel >= upgrade.max_level;
                  const purchasePrice = upgrade.price_crystals * (currentLevel + 1);
                  const crystalBalance = playerState.player.crystals;
                  const canAfford = crystalBalance >= purchasePrice;

                  return (
                    <CelestialUpgradeCard
                      key={upgrade.id}
                      name={upgrade.name}
                      description={upgrade.description}
                      icon={getCelestialUpgradeIcon(upgrade.upgrade_type, upgrade.icon_name)}
                      priceCrystals={upgrade.price_crystals}
                      canAfford={canAfford}
                      isMax={isMax}
                      loading={buyingUpgradeId === upgrade.id}
                      onBuy={() => handleBuyUpgrade(upgrade)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-zinc-500">
                Небесные апгрейды пока не настроены
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

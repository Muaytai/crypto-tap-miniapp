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

    setBuyingUpgradeId(upgrade.id);
    setError(null);
    setSuccess(null);
    try {
      const price = upgrade.price_crystals * (currentLevel + 1);
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
    return <div className="p-4 text-center text-zinc-500">Загрузка...</div>;
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
          <p className="mt-2 text-center text-4xl font-black text-cyan-300">💎 {potentialCrystals}</p>
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
        <div className="rounded-xl bg-emerald-500/20 p-3 text-sm text-emerald-300">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-red-500/20 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {status.can_prestige ? (
        <button
          onClick={handlePrestige}
          disabled={loading}
          className="tap-target w-full rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 py-4 text-lg font-bold text-white transition hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {loading ? "Закалка..." : "Сделать перезакалку"}
        </button>
      ) : (
        <button
          disabled
          className="w-full rounded-2xl bg-zinc-800 py-4 text-lg font-bold text-zinc-500"
        >
          🔒 Недостаточно кликов
        </button>
      )}

      <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/30 p-3">
        <p className="text-xs text-zinc-400">
          ⚡ После закалки вы получите алмазы, но потеряете все монеты, предметы и обычные улучшения.<br />
          💎 Алмазы и небесные апгрейды останутся с вами навсегда!
        </p>
      </div>

      <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/30 to-violet-950/20 p-4">
        <h3 className="text-lg font-bold tracking-wide text-purple-200">НЕБЕСНЫЕ АПГРЕЙДЫ</h3>
        <p className="mt-1 text-sm text-zinc-400">
          Баланс: <span className="font-semibold text-cyan-300">💎 {status.crystals.toLocaleString("ru-RU")}</span>
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {upgrades.length > 0 ? (
          Object.entries(
            upgrades.reduce(
              (acc, upgrade) => {
                const type = upgrade.upgrade_type;
                if (!acc[type]) acc[type] = [];
                acc[type].push(upgrade);
                return acc;
              },
              {} as Record<string, typeof upgrades>
            )
          ).map(([upgradeType, typeUpgrades]) => {
            // Название раздела и описание по типу
            const typeInfo: Record<
              string,
              { title: string; description: string; emoji: string }
            > = {
              global_income: {
                title: "🌍 МНОЖИТЕЛЬ ДОХОДА",
                description: "Увеличьте ваш доход от каждого тапа",
                emoji: "💰",
              },
              tap_bonus: {
                title: "👆 БОНУС К ТАПАМ",
                description: "Каждый тап будет сильнее",
                emoji: "⚡",
              },
              offline_boost: {
                title: "⏰ ОФФЛАЙН БОНУСЫ",
                description: "Больше дохода при офлайне",
                emoji: "😴",
              },
              auto_tap: {
                title: "⚙️ АВТОМАТИЗАЦИЯ",
                description: "Получайте доход без участия",
                emoji: "🤖",
              },
            };

            const info = typeInfo[upgradeType] || {
              title: "АПГРЕЙДЫ",
              description: "Улучшения",
              emoji: "✨",
            };

            return (
              <div key={upgradeType}>
                {/* Апгрейды этого типа */}
                <div className="flex flex-col gap-2">
                  {typeUpgrades.map((upgrade) => {
                    const currentLevel = playerUpgrades.get(upgrade.id) || 0;
                    const isMax = currentLevel >= upgrade.max_level;
                    const price = upgrade.price_crystals * (currentLevel + 1);
                    const canAfford = status.crystals >= price;

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

                    return (
                      <div
                        key={upgrade.id}
                        className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/30 to-violet-950/20 p-3"
                      >
                        <div className="flex gap-3">
                          {/* Иконка */}
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-2xl">
                            {getIcon()}
                          </div>

                          {/* Основная информация */}
                          <div className="flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="font-bold text-white">{upgrade.name}</p>
                              <p className="text-xs font-semibold text-zinc-400">
                                Уровень: {currentLevel}/{upgrade.max_level}
                              </p>
                            </div>
                            <p className="mt-1 text-xs text-zinc-400">{upgrade.description}</p>
                            <p className="mt-2 text-xs font-semibold text-cyan-300">
                              💎 {price.toLocaleString("ru-RU")}
                            </p>
                          </div>
                        </div>

                        {/* Прогресс бар */}
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                            style={{ width: `${(currentLevel / upgrade.max_level) * 100}%` }}
                          />
                        </div>

                        {/* Кнопка */}
                        <button
                          onClick={() => handleBuyUpgrade(upgrade)}
                          disabled={isMax || !canAfford || buyingUpgradeId === upgrade.id}
                          className={`tap-target mt-3 w-full rounded-xl py-2 text-xs font-bold uppercase transition ${
                            isMax
                              ? "bg-emerald-900/40 text-emerald-300"
                              : canAfford
                                ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-purple-500/50"
                                : "bg-zinc-800 text-zinc-500"
                          }`}
                        >
                          {isMax
                            ? "✓ MAX"
                            : buyingUpgradeId === upgrade.id
                              ? "..."
                              : `Купить 💎 ${price.toLocaleString("ru-RU")}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-zinc-500">
            Небесные апгрейды пока не настроены
          </div>
        )}
      </div>

      {upgrades.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-zinc-500">
          Небесные апгрейды пока не настроены
        </div>
      )}
    </div>
  );
}
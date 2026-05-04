"use client";

import { useState, useEffect } from "react";
import { fetchCelestialUpgrades, buyCelestialUpgrade, type PlayerState } from "@/lib/api";

type Props = {
  initData: string;
  playerState: PlayerState;
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

export function CelestialPanel({ initData, playerState, onUpdate }: Props) {
  const [upgrades, setUpgrades] = useState<CelestialUpgrade[]>([]);
  const [playerUpgrades, setPlayerUpgrades] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [upgradesList] = await Promise.all([
          fetchCelestialUpgrades(initData),
        ]);
        setUpgrades(upgradesList);

        // Загружаем купленные апгрейды из playerState (нужно добавить в PlayerState)
        // Пока что используем localStorage для демо
        try {
          const saved = localStorage.getItem(`celestial_${playerState.player.telegram_id}`);
          if (saved) {
            const parsed = JSON.parse(saved) as PlayerCelestial[];
            const map = new Map<number, number>();
            parsed.forEach(p => map.set(p.upgrade_id, p.level));
            setPlayerUpgrades(map);
          }
        } catch (e) {
          console.error(e);
        }
      } catch (err) {
        console.error("Failed to load celestial upgrades:", err);
      }
    };
    loadData();
  }, [initData, playerState.player.telegram_id]);

  const savePlayerUpgrades = (upgradeId: number, level: number) => {
    const newMap = new Map(playerUpgrades);
    newMap.set(upgradeId, level);
    setPlayerUpgrades(newMap);

    const arr = Array.from(newMap.entries()).map(([id, lvl]) => ({ upgrade_id: id, level: lvl }));
    localStorage.setItem(`celestial_${playerState.player.telegram_id}`, JSON.stringify(arr));
  };

  const handleBuy = async (upgrade: CelestialUpgrade) => {
    const currentLevel = playerUpgrades.get(upgrade.id) || 0;
    if (currentLevel >= upgrade.max_level) {
      setError("Достигнут максимальный уровень");
      return;
    }

    setLoading(upgrade.id);
    setError(null);
    try {
      const result = await buyCelestialUpgrade(initData, upgrade.id);
      if (result.success) {
        savePlayerUpgrades(upgrade.id, result.new_level);
        // Обновляем баланс кристаллов
        onUpdate({
          ...playerState,
          player: {
            ...playerState.player,
            crystals: result.crystals_left,
          },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка покупки");
    } finally {
      setLoading(null);
    }
  };

  const getEffectText = (upgrade: CelestialUpgrade, level: number): string => {
    const totalValue = upgrade.value * level;
    switch (upgrade.upgrade_type) {
      case "global_income":
        return `+${Math.round((totalValue - 1) * 100)}% ко всему доходу`;
      case "tap_bonus":
        return `Тапы дают x${totalValue} монет`;
      case "offline_boost":
        return `+${totalValue} минут к оффлайн лимиту`;
      default:
        return `x${totalValue}`;
    }
  };

  const getNextEffect = (upgrade: CelestialUpgrade, currentLevel: number): string => {
    if (currentLevel >= upgrade.max_level) return "MAX";
    const nextValue = upgrade.value * (currentLevel + 1);
    switch (upgrade.upgrade_type) {
      case "global_income":
        return `+${Math.round((nextValue - 1) * 100)}%`;
      case "tap_bonus":
        return `x${nextValue}`;
      case "offline_boost":
        return `+${nextValue} мин`;
      default:
        return `x${nextValue}`;
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/30 to-violet-950/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">🌌 Небесные апгрейды</h2>
            <p className="text-xs text-zinc-400">
              Покупаются за алмазы и НЕ СБРАСЫВАЮТСЯ при закалке
            </p>
          </div>
          <div className="rounded-full bg-purple-500/20 px-3 py-1 text-lg text-purple-400">
            💎 {playerState.player.crystals.toLocaleString("ru-RU")}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/20 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {upgrades.map((upgrade) => {
          const currentLevel = playerUpgrades.get(upgrade.id) || 0;
          const canAfford = playerState.player.crystals >= upgrade.price_crystals * (currentLevel + 1);
          const isMax = currentLevel >= upgrade.max_level;

          return (
            <div
              key={upgrade.id}
              className="rounded-2xl border border-purple-500/20 bg-white/5 p-4 transition hover:border-purple-500/40"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-white">{upgrade.name}</h3>
                  <p className="text-xs text-zinc-400">{upgrade.description}</p>
                  <div className="mt-2">
                    <p className="text-sm text-cyan-400">
                      {getEffectText(upgrade, currentLevel || 1)}
                    </p>
                    {!isMax && currentLevel > 0 && (
                      <p className="text-xs text-zinc-500">
                        Следующий уровень: {getNextEffect(upgrade, currentLevel)}
                      </p>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                        style={{ width: `${(currentLevel / upgrade.max_level) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500">
                      Ур. {currentLevel} / {upgrade.max_level}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  {isMax ? (
                    <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400">
                      MAX
                    </span>
                  ) : (
                    <button
                      onClick={() => handleBuy(upgrade)}
                      disabled={loading === upgrade.id || !canAfford}
                      className={`tap-target rounded-xl px-4 py-2 text-sm font-medium transition ${
                        canAfford
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105"
                          : "bg-zinc-700 text-zinc-500"
                      }`}
                    >
                      {loading === upgrade.id
                        ? "..."
                        : `${(upgrade.price_crystals * (currentLevel + 1)).toLocaleString("ru-RU")} 💎`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {upgrades.length === 0 && (
        <p className="py-8 text-center text-zinc-500">
          Пока нет доступных небесных апгрейдов
        </p>
      )}
    </div>
  );
}
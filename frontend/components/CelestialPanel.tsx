"use client";

import { useState, useEffect } from "react";
import {
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

export function CelestialPanel({ initData, playerState, onUpdate }: Props) {
  const isDev = isLocalDevMock(initData);
  const [upgrades, setUpgrades] = useState<CelestialUpgrade[]>([]);
  const [playerUpgrades, setPlayerUpgrades] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const upgradesList = await fetchCelestialUpgrades(initData);
        setUpgrades(upgradesList);
        try {
          const saved = localStorage.getItem(`celestial_${playerState.player.telegram_id}`);
          if (saved) {
            const parsed = JSON.parse(saved) as PlayerCelestial[];
            const map = new Map<number, number>();
            parsed.forEach((p) => map.set(p.upgrade_id, p.level));
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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка покупки");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-wide text-white">НЕБЕСНЫЕ АПГРЕЙДЫ</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Баланс:{" "}
            <CrystalCost
              amount={playerState.player.crystals}
              className="font-semibold text-cyan-300"
            />
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Покупаются за алмазы и не сбрасываются при закалке
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/20 p-3 text-sm text-red-300">{error}</div>
        )}

        {upgrades.length > 0 ? (
          <div className="flex flex-col gap-3">
            {upgrades.map((upgrade) => {
              const currentLevel = playerUpgrades.get(upgrade.id) || 0;
              const isMax = currentLevel >= upgrade.max_level;
              const price = upgrade.price_crystals * (currentLevel + 1);
              const canAfford = playerState.player.crystals >= price;

              return (
                <CelestialUpgradeCard
                  key={upgrade.id}
                  name={upgrade.name}
                  description={upgrade.description}
                  icon={getCelestialUpgradeIcon(upgrade.upgrade_type, upgrade.icon_name)}
                  currentLevel={currentLevel}
                  maxLevel={upgrade.max_level}
                  priceCrystals={price}
                  canAfford={canAfford}
                  isMax={isMax}
                  loading={loading === upgrade.id}
                  onBuy={() => handleBuy(upgrade)}
                />
              );
            })}
          </div>
        ) : (
          <p className="py-8 text-center text-zinc-500">Пока нет доступных небесных апгрейдов</p>
        )}
      </section>
    </div>
  );
}

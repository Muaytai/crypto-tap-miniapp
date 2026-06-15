"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAchievements, type PlayerState } from "@/lib/api";
import { AchievementIcon } from "@/components/AchievementIcon";

type Props = {
  initData: string;
  playerState: PlayerState;
  onReward?: (coins: number, crystals: number) => void;
};

type Achievement = {
  id: number;
  name: string;
  description: string;
  trigger_type: string;
  trigger_value: number;
  reward_crystals: number;
  reward_coins: number;
  is_earned: boolean;
};

export function AchievementsList({ initData, playerState, onReward }: Props) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAchievements, setNewAchievements] = useState<any[]>([]);

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const data = await fetchAchievements(initData);
        setAchievements(data.achievements || []);
        if (data.new_achievements?.length > 0) {
          setNewAchievements(data.new_achievements);
          data.new_achievements.forEach((ach: any) => {
            if (ach.reward_coins > 0 || ach.reward_crystals > 0) {
              onReward?.(ach.reward_coins, ach.reward_crystals);
            }
          });
          setTimeout(() => setNewAchievements([]), 5000);
        }
      } catch (err) {
        console.error("Failed to load achievements:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAchievements();
  }, [initData, playerState.player.total_taps, playerState.player.prestige_count, onReward]);

  const getTriggerText = (type: string, value: number): string => {
    switch (type) {
      case "total_taps":
        return `Сделайте ${value.toLocaleString("ru-RU")} кликов`;
      case "total_coins_earned":
        return `Заработайте ${value.toLocaleString("ru-RU")} монет`;
      case "prestige_count":
        return `Сделайте ${value} закалок`;
      case "items_bought":
        return `Купите ${value.toLocaleString("ru-RU")} предметов`;
      default:
        return `${value.toLocaleString("ru-RU")}`;
    }
  };

  const statValues = useMemo(() => {
    const totalItems = playerState.items.reduce((sum, it) => sum + it.quantity, 0);
    return {
      total_taps: playerState.player.total_taps,
      total_coins_earned: playerState.player.total_earned_all_time,
      prestige_count: playerState.player.prestige_count,
      items_bought: totalItems,
      crystals_spent: 0,
    };
  }, [playerState]);

  const getCurrentValue = (ach: Achievement): number => {
    return statValues[ach.trigger_type as keyof typeof statValues] ?? 0;
  };

  const earnedCount = achievements.filter((a) => a.is_earned).length;
  const progress = achievements.length > 0 ? (earnedCount / achievements.length) * 100 : 0;

  if (loading) {
    return <div className="py-12 text-center text-cyan-400/70">Загрузка достижений...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Общий прогресс */}
      <div className="rounded-3xl border border-cyan-500/20 bg-zinc-950/80 p-5">
        <div className="flex justify-between mb-2">
          <span className="font-pixel text-sm text-cyan-400">ПРОГРЕСС ДОСТИЖЕНИЙ</span>
          <span className="font-mono text-lg font-bold text-white">
            {earnedCount}/{achievements.length}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-900">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Список */}
      <div className="flex flex-col gap-3">
        {achievements.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-zinc-950/60 p-8 text-center text-zinc-500">
            Достижения скоро появятся
          </div>
        ) : (
          achievements.map((ach) => {
            const current = getCurrentValue(ach);
            const pct = ach.trigger_value > 0 ? Math.min(100, (current / ach.trigger_value) * 100) : 0;

            return (
              <div
                key={ach.id}
                className={`group relative overflow-hidden rounded-3xl border p-5 transition-all backdrop-blur-xl ${
                  ach.is_earned
                    ? "border-emerald-400/50 bg-emerald-950/30 shadow-2xl shadow-emerald-500/10"
                    : "border-white/10 bg-zinc-950/80 hover:border-cyan-400/40 hover:shadow-xl"
                }`}
              >
                <div className="flex gap-5">
                  <AchievementIcon achievement={ach} progressPct={pct} />

                  <div className="flex-1 min-w-0">
                    <h3 className="font-pixel text-lg font-bold text-white tracking-wide">{ach.name}</h3>
                    <p className="mt-1 text-sm text-cyan-300">{getTriggerText(ach.trigger_type, ach.trigger_value)}</p>

                    {ach.description && (
                      <p className="mt-2 text-xs text-zinc-400 leading-relaxed">{ach.description}</p>
                    )}

                    <div className="mt-4 flex items-center justify-between text-sm">
                      <div className="font-mono text-zinc-400">
                        {current.toLocaleString("ru-RU")} / {ach.trigger_value.toLocaleString("ru-RU")}
                      </div>
                      <div className="font-mono text-emerald-400">
                        +{ach.reward_coins}₿ {ach.reward_crystals > 0 && `+${ach.reward_crystals}💎`}
                      </div>
                    </div>
                  </div>
                </div>

                {!ach.is_earned && (
                  <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
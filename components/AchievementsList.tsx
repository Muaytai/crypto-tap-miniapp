"use client";

import { useState, useEffect } from "react";
import { fetchAchievements, type PlayerState } from "@/lib/api";

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
        setAchievements(data.achievements);
        if (data.new_achievements?.length > 0) {
          setNewAchievements(data.new_achievements);
          // Уведомляем о наградах
          for (const ach of data.new_achievements) {
            if (ach.reward_coins > 0 || ach.reward_crystals > 0) {
              onReward?.(ach.reward_coins, ach.reward_crystals);
            }
          }
          // Скрываем уведомления через 5 секунд
          setTimeout(() => setNewAchievements([]), 5000);
        }
      } catch (err) {
        console.error("Failed to load achievements:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAchievements();
  }, [initData, playerState.player.total_taps, playerState.player.prestige_count]);

  const getTriggerText = (type: string, value: number): string => {
    switch (type) {
      case "total_taps":
        return `Сделать ${value.toLocaleString("ru-RU")} тапов`;
      case "total_coins_earned":
        return `Заработать ${value.toLocaleString("ru-RU")} токенов`;
      case "prestige_count":
        return `Сделать закалку ${value} раз`;
      case "items_bought":
        return `Купить ${value} предметов`;
      default:
        return `${value.toLocaleString("ru-RU")}`;
    }
  };

  const earnedCount = achievements.filter(a => a.is_earned).length;
  const visibleAchievements = achievements.slice(0, 4);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-zinc-500">
        Загрузка достижений...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Уведомления о новых достижениях */}
      {newAchievements.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-bounce rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 p-3 text-center shadow-xl">
          <p className="text-sm font-bold text-white">🏆 Новое достижение! 🏆</p>
          {newAchievements.map((ach, idx) => (
            <p key={idx} className="text-xs text-white/90">
              {ach.name} +{ach.reward_crystals}💎 +{ach.reward_coins}💰
            </p>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl border border-cyan-500/20 bg-cyan-950/30 p-3">
        <div>
          <p className="text-xs text-zinc-400">Достижения</p>
          <p className="text-2xl font-bold text-white">
            {earnedCount} / {achievements.length}
          </p>
        </div>
        <div className="h-2 w-32 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
            style={{ width: `${(earnedCount / achievements.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {visibleAchievements.map((ach) => (
          <div
            key={ach.id}
            className={`rounded-xl border p-3 transition ${
              ach.is_earned
                ? "border-green-500/30 bg-green-950/20"
                : "border-white/10 bg-white/5 opacity-70"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{ach.is_earned ? "🏆" : "🔒"}</span>
                  <div>
                    <h4 className="font-medium text-white">{ach.name}</h4>
                    <p className="text-xs text-zinc-400">
                      {getTriggerText(ach.trigger_type, ach.trigger_value)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                {ach.is_earned ? (
                  <span className="text-xs text-green-400">✓ Получено</span>
                ) : (
                  <div className="text-xs text-zinc-500">
                    {ach.reward_crystals > 0 && <span>+{ach.reward_crystals}💎 </span>}
                    {ach.reward_coins > 0 && <span>+{ach.reward_coins}💰</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
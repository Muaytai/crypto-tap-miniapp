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
        return `Сделайте ${value.toLocaleString("ru-RU")} кликов`;
      case "total_coins_earned":
        return `Заработайте ${value.toLocaleString("ru-RU")} осколков`;
      case "prestige_count":
        return `Сделайте закалку ${value} раз`;
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
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-zinc-500">
        Загрузка достижений...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
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

      <div className="rounded-2xl border border-[#2e3a43] bg-[#141920] p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-pixel text-xs uppercase tracking-wide text-[#a8b5c2]">Достижения</p>
          <p className="font-pixel text-sm text-[#f6cd2d]">
            {earnedCount}/{achievements.length}
          </p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-sm bg-[#2a3038]">
          <div className="h-full bg-[#f6cd2d] transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {achievements.length === 0 ? (
          <div className="rounded-xl border border-[#3a424c] bg-[#1a2028] p-4 text-center font-pixel text-xs text-[#8f9bab]">
            Достижения скоро появятся
          </div>
        ) : (
          achievements.map((ach) => {
            const current = getCurrentValue(ach);
            const pct = ach.trigger_value > 0 ? Math.min(100, (current / ach.trigger_value) * 100) : 0;
            return (
              <div
                key={ach.id}
                className={`rounded-xl border p-2.5 transition-all ${
                  ach.is_earned
                    ? "border-[#f6cd2d] bg-[#1a1b14] shadow-[0_0_0_1px_rgba(246,205,45,0.25),0_0_16px_rgba(246,205,45,0.12)]"
                    : "border-[#2b3945] bg-[#121922]/90 opacity-75"
                }`}
              >
                <div className="mb-1 flex items-start gap-2.5">
                  <AchievementIcon achievement={ach} progressPct={pct} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-pixel text-[16px] leading-none text-[#eef2f6]">{ach.name}</h4>
                      {ach.is_earned ? (
                        <span className="shrink-0 rounded border border-[#f6cd2d]/70 bg-[#f6cd2d]/15 px-1.5 py-0.5 font-pixel text-[9px] uppercase tracking-wide text-[#f6cd2d]">
                          выполнено
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 font-pixel text-[10px] text-[#aeb8c5]">
                      {getTriggerText(ach.trigger_type, ach.trigger_value)}
                    </p>
                    {ach.description ? (
                      <p
                        className={`mt-1.5 font-pixel text-[10px] leading-relaxed ${
                          ach.is_earned ? "text-[#e8bf2f]" : "text-[#7f8d9d]"
                        }`}
                      >
                        {ach.description}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-1.5">
                  <div className="h-1.5 overflow-hidden rounded bg-[#2a333d]">
                    <div
                      className={`h-full transition-all ${ach.is_earned ? "bg-[#f6cd2d]" : "bg-[#2fb5ef]"}`}
                      style={{ width: `${ach.is_earned ? 100 : pct}%` }}
                    />
                  </div>
                  <p className="mt-1 font-pixel text-[10px] text-[#9aa7b5]">
                    {Math.min(current, ach.trigger_value).toLocaleString("ru-RU")} /{" "}
                    {ach.trigger_value.toLocaleString("ru-RU")}
                  </p>
                </div>
                <div className="mt-1.5 font-pixel text-[10px] text-[#9aa7b5]">
                  Награда:
                  {ach.reward_coins > 0 ? ` +${ach.reward_coins.toLocaleString("ru-RU")} монет` : ""}
                  {ach.reward_crystals > 0 ? ` +${ach.reward_crystals} крист.` : ""}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
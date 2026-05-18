"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAchievements, type PlayerState } from "@/lib/api";
import { AchievementIcon } from "@/components/AchievementIcon";
import { GoalTierBadge } from "@/components/GoalTierBadge";
import { GoalRewardChips } from "@/components/GoalRewardChips";
import {
  getGoalTier,
  tierCardClass,
  tierTitleClass,
  type GoalTier,
} from "@/lib/goalTiers";

type Props = {
  initData: string;
  playerState: PlayerState;
  onReward?: (coins: number, crystals: number) => void;
};

type Achievement = {
  id: number;
  name: string;
  description: string;
  icon_name?: string;
  trigger_type: string;
  trigger_value: number;
  reward_crystals: number;
  reward_coins: number;
  is_earned: boolean;
};

export function AchievementsList({ initData, playerState, onReward }: Props) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [newAchievements, setNewAchievements] = useState<any[]>([]);

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        setLoadError(null);
        const data = await fetchAchievements(initData);
        setAchievements(data.achievements);
        if (data.new_achievements?.length > 0) {
          setNewAchievements(data.new_achievements);
          for (const ach of data.new_achievements) {
            if (ach.reward_coins > 0 || ach.reward_crystals > 0) {
              onReward?.(ach.reward_coins, ach.reward_crystals);
            }
          }
          setTimeout(() => setNewAchievements([]), 5000);
        }
      } catch (err) {
        console.error("Failed to load achievements:", err);
        setAchievements([]);
        setLoadError(err instanceof Error ? err.message : "Ошибка загрузки");
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

  const spotlight = useMemo(() => {
    let best: { ach: Achievement; pct: number; tier: GoalTier } | null = null;
    for (const ach of achievements) {
      if (ach.is_earned) continue;
      const tier = getGoalTier(ach);
      if (tier < 4) continue;
      const current = statValues[ach.trigger_type as keyof typeof statValues] ?? 0;
      const pct =
        ach.trigger_value > 0 ? Math.min(100, (current / ach.trigger_value) * 100) : 0;
      if (
        !best ||
        tier > best.tier ||
        (tier === best.tier && pct > best.pct)
      ) {
        best = { ach, pct, tier };
      }
    }
    return best;
  }, [achievements, statValues]);

  const progressBarClass = (tier: GoalTier, earned: boolean) => {
    if (earned) return "bg-[#f6cd2d]";
    if (tier >= 5) return "bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300";
    if (tier >= 4) return "bg-gradient-to-r from-violet-500 to-fuchsia-400";
    if (tier >= 3) return "bg-gradient-to-r from-amber-500 to-orange-400";
    return "bg-gradient-to-r from-emerald-500 to-cyan-500";
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-zinc-500">
        Загрузка достижений...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 pb-1">
      {newAchievements.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-bounce rounded-xl border border-amber-400/40 bg-gradient-to-r from-amber-700/95 to-orange-800/95 p-3 text-center shadow-xl backdrop-blur-sm">
          <p className="text-sm font-bold text-white">₿ Новая цель выполнена!</p>
          {newAchievements.map((ach, idx) => (
            <p key={idx} className="text-xs text-white/90">
              {ach.name} +{ach.reward_crystals}💎 +{ach.reward_coins}💰
            </p>
          ))}
        </div>
      )}

      <div className="shrink-0 rounded-2xl border border-cyan-500/20 bg-[#141920]/90 p-3 shadow-[0_0_24px_rgba(14,116,144,0.12)] backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-pixel text-xs uppercase tracking-wide text-cyan-200/80">Прогресс целей</p>
          <p className="font-pixel text-sm text-[#f6cd2d]">
            {earnedCount}/{achievements.length}
          </p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-sm bg-[#2a3038]">
          <div className="h-full bg-[#f6cd2d] transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {spotlight ? (
        <div className="shrink-0 rounded-xl border border-orange-400/35 bg-gradient-to-br from-orange-950/40 via-[#141920]/95 to-violet-950/30 p-3 shadow-[0_0_24px_rgba(251,146,60,0.12)] ring-1 ring-amber-400/20">
          <p className="mb-2 font-pixel text-[9px] uppercase tracking-widest text-orange-300/90">
            Следующая большая цель
          </p>
          <div className="flex gap-3">
            <AchievementIcon
              achievement={spotlight.ach}
              progressPct={spotlight.pct}
              tier={spotlight.tier}
            />
            <div className="min-w-0 flex-1">
              <GoalTierBadge tier={spotlight.tier} className="mb-1.5" />
              <h4 className={tierTitleClass(spotlight.tier)}>{spotlight.ach.name}</h4>
              <p className="mt-1 font-pixel text-[10px] text-cyan-200/70">
                {getTriggerText(spotlight.ach.trigger_type, spotlight.ach.trigger_value)}
              </p>
              <div className="mt-3 space-y-1.5">
                <div className="h-1.5 overflow-hidden rounded-full bg-black/35">
                  <div
                    className={`h-full transition-all ${progressBarClass(spotlight.tier, false)}`}
                    style={{ width: `${spotlight.pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-pixel text-[9px] text-amber-200/60">
                    {Math.round(spotlight.pct)}% · держи курс
                  </p>
                  <GoalRewardChips
                    rewardCoins={spotlight.ach.reward_coins}
                    rewardCrystals={spotlight.ach.reward_crystals}
                    compact
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2.5">
        {achievements.length === 0 ? (
          <div className="rounded-xl border border-[#3a424c] bg-[#1a2028] p-4 text-center font-pixel text-xs text-[#8f9bab]">
            {loadError ? (
              <>
                <p className="text-amber-200/90">Не удалось загрузить достижения</p>
                {process.env.NODE_ENV === "development" ? (
                  <p className="mt-2 break-all text-[10px] text-zinc-500">{loadError}</p>
                ) : (
                  <p className="mt-2 text-[10px] text-zinc-500">Проверьте соединение и откройте вкладку снова.</p>
                )}
              </>
            ) : (
              <>
                <p>Достижения скоро появятся</p>
                {process.env.NODE_ENV === "development" ? (
                  <p className="mt-2 text-[10px] text-zinc-500">
                    Если список должен быть полным: на бэкенде{" "}
                    <span className="font-mono text-zinc-400">migrate</span> /{" "}
                    <span className="font-mono text-zinc-400">seed_achievements</span> (миграция 0007 сидит
                    автоматически).
                  </p>
                ) : null}
              </>
            )}
          </div>
        ) : (
          achievements.map((ach) => {
            const current = getCurrentValue(ach);
            const pct = ach.trigger_value > 0 ? Math.min(100, (current / ach.trigger_value) * 100) : 0;
            const tier = getGoalTier(ach);
            return (
              <div key={ach.id} className={tierCardClass(tier, ach.is_earned)}>
                {tier === 5 && !ach.is_earned ? (
                  <div
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,146,60,0.14),transparent_60%)]"
                    aria-hidden
                  />
                ) : null}
                {tier === 4 && !ach.is_earned ? (
                  <div
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(139,92,246,0.1),transparent_55%)]"
                    aria-hidden
                  />
                ) : null}

                <div className="relative flex gap-3">
                  <AchievementIcon achievement={ach} progressPct={pct} tier={tier} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <GoalTierBadge tier={tier} className="mb-1" />
                        <h4 className={tierTitleClass(tier)}>{ach.name}</h4>
                      </div>
                      {ach.is_earned ? (
                        <span
                          className="shrink-0 flex h-6 w-6 items-center justify-center rounded-md border border-[#f6cd2d]/70 bg-[#f6cd2d]/15 font-pixel text-[10px] text-[#f6cd2d]"
                          title="Выполнено"
                        >
                          ✓
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 font-pixel text-[10px] text-[#aeb8c5]">
                      {getTriggerText(ach.trigger_type, ach.trigger_value)}
                    </p>
                    {ach.description ? (
                      <p
                        className={`mt-1.5 font-pixel text-[10px] leading-relaxed ${
                          ach.is_earned ? "text-amber-200/90" : tier >= 4 ? "text-slate-300" : "text-slate-400"
                        }`}
                      >
                        {ach.description}
                      </p>
                    ) : null}
                    <div className="mt-2.5 space-y-1.5">
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#2a333d]">
                        <div
                          className={`h-full transition-all ${progressBarClass(tier, ach.is_earned)}`}
                          style={{ width: `${ach.is_earned ? 100 : pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-pixel text-[9px] tabular-nums text-[#9aa7b5]">
                          {Math.min(current, ach.trigger_value).toLocaleString("ru-RU")}
                          <span className="text-zinc-600"> / </span>
                          {ach.trigger_value.toLocaleString("ru-RU")}
                        </p>
                        <GoalRewardChips
                          rewardCoins={ach.reward_coins}
                          rewardCrystals={ach.reward_crystals}
                          compact
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

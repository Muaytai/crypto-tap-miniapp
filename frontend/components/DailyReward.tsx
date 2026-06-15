"use client";

import { useState, useEffect } from "react";
import {
  claimDailyReward,
  fetchDailyRewardStatus,
  resolveDailyDaySchedule,
  type DailyRewardDaySlot,
  type DailyRewardStatus,
} from "@/lib/api";

type Props = {
  initData: string;
  onUpdate: (coins: number, crystals: number) => void;
};

function rewardCaption(row: DailyRewardDaySlot): string {
  if (row.reward_crystals > 0 && row.reward_coins <= 0) {
    return `◆${row.reward_crystals}`;
  }
  const parts: string[] = [];
  if (row.reward_coins > 0) parts.push(row.reward_coins.toLocaleString("ru-RU"));
  if (row.reward_crystals > 0) parts.push(`◆${row.reward_crystals}`);
  return parts.join(" · ") || "—";
}

export function DailyReward({ initData, onUpdate }: Props) {
  const [status, setStatus] = useState<DailyRewardStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStatus = async () => {
    try {
      const data = await fetchDailyRewardStatus(initData);
      setStatus(data);
    } catch (err) {
      console.error("Failed to load daily reward:", err);
    }
  };

  useEffect(() => {
    void loadStatus();
  }, [initData]);

  const handleClaim = async () => {
    setLoading(true);
    try {
      const data = await claimDailyReward(initData);
      setStatus(data);
      if (data.reward_coins > 0 || data.reward_crystals > 0) {
        onUpdate(data.reward_coins, data.reward_crystals);
      }
    } catch (err) {
      console.error("Failed to claim daily reward:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!status) {
    return (
      <div className="rounded-3xl border border-cyan-500/20 bg-zinc-950/80 p-6 text-center text-zinc-400">
        Загрузка ежедневной награды...
      </div>
    );
  }

  const schedule = resolveDailyDaySchedule(status);

  return (
    <div className="rounded-3xl border border-cyan-500/20 bg-zinc-950/80 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-pixel text-lg text-cyan-300">ЕЖЕДНЕВНАЯ НАГРАДА</h3>
        <div className="rounded-full border border-cyan-400/30 bg-cyan-950/50 px-3 py-1 text-xs font-mono text-cyan-400">
          День {status.day_slot} / 7
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {schedule.map((row) => {
          const isClaimable = row.status === "claimable" && status.can_claim;
          const isClaimed = row.status === "claimed";

          return (
            <button
              key={row.day}
              onClick={isClaimable ? handleClaim : undefined}
              disabled={!isClaimable}
              className={`tap-target flex aspect-square flex-col items-center justify-center rounded-2xl border p-1 transition-all ${
                isClaimed
                  ? "border-emerald-400/50 bg-emerald-950/30"
                  : isClaimable
                  ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                  : "border-white/10 bg-zinc-900/70 opacity-60"
              }`}
            >
              <span className="text-lg font-bold text-white">{row.day}</span>
              <span className="mt-1 text-[10px] text-cyan-300">{rewardCaption(row)}</span>
              {isClaimed && <span className="mt-1 text-emerald-400">✓</span>}
            </button>
          );
        })}
      </div>

      {!status.can_claim && status.message && (
        <p className="mt-4 text-center text-xs text-zinc-400">{status.message}</p>
      )}
    </div>
  );
}
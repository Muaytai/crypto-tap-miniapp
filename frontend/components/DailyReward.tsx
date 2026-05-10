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
  if (row.reward_coins > 0) {
    parts.push(`${row.reward_coins.toLocaleString("ru-RU")}`);
  }
  if (row.reward_crystals > 0) {
    parts.push(`◆${row.reward_crystals}`);
  }
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
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-zinc-500">
        Загрузка...
      </div>
    );
  }

  const schedule = resolveDailyDaySchedule(status);

  return (
    <div className="rounded-2xl border border-[#2e3a43] bg-[#141920] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-pixel text-[15px] text-[#f3f7ff]">Ежедневная награда</h3>
        <div className="shrink-0 rounded-md border border-[#0c6b96] bg-[#05384d] px-2 py-0.5 font-pixel text-[11px] text-[#47d2ff]">
          День {status.day_slot} / 7
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {schedule.map((row) => {
          const isClaimable = row.status === "claimable" && status.can_claim;
          const isClaimed = row.status === "claimed";
          const isLocked = row.status === "locked";

          const cellClass = isClaimable
            ? "border-[#04a9f4] bg-[#063045] shadow-[0_0_0_1px_rgba(4,169,244,0.35),0_0_12px_rgba(4,169,244,0.2)]"
            : isClaimed
              ? "border-[#3d4a35] bg-[#1a2218]/90 opacity-90"
              : "border-[#2a333d] bg-[#0f1419]/80 opacity-55";

          const inner = (
            <>
              <span className="font-pixel text-[14px] font-bold tabular-nums leading-none text-[#f5f7fa]">
                {row.day}
              </span>
              <span className="mt-1 line-clamp-2 text-center font-pixel text-[10px] leading-snug text-[#c5d0dc]">
                {rewardCaption(row)}
              </span>
              {isClaimed ? (
                <span className="mt-1 font-pixel text-[11px] leading-none text-[#86efac]">✓</span>
              ) : isClaimable ? (
                <span className="mt-1 font-pixel text-[9px] uppercase tracking-wide text-[#7dd3fc]">
                  забрать
                </span>
              ) : null}
            </>
          );

          if (isClaimable) {
            return (
              <button
                key={row.day}
                type="button"
                disabled={loading}
                onClick={() => void handleClaim()}
                className={`tap-target flex min-h-[5.5rem] min-w-0 flex-col items-center justify-center rounded-lg border px-0.5 py-2 transition disabled:opacity-50 ${cellClass}`}
              >
                {inner}
              </button>
            );
          }

          return (
            <div
              key={row.day}
              className={`flex min-h-[5.5rem] min-w-0 flex-col items-center justify-center rounded-lg border px-0.5 py-2 ${cellClass}`}
            >
              {inner}
            </div>
          );
        })}
      </div>

      {!status.can_claim && (
        <p className="mt-2 text-center font-pixel text-[11px] leading-snug text-[#8f9bab]">
          {status.message || "Награда уже получена сегодня. Завтра — следующий день!"}
        </p>
      )}

      <div className="mt-2 flex justify-between gap-2 font-pixel text-[10px] text-[#73808f]">
        <span>Макс. серия: {status.max_streak}</span>
        {status.last_claim_date && (
          <span className="truncate text-right">
            Последняя дата: {new Date(status.last_claim_date).toLocaleDateString("ru-RU")}
          </span>
        )}
      </div>
    </div>
  );
}

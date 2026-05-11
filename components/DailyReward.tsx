"use client";

import { useState, useEffect } from "react";
import {
  claimDailyReward,
  fetchDailyRewardStatus,
  type DailyRewardStatus,
} from "@/lib/api";

type Props = {
  initData: string;
  onUpdate: (coins: number, crystals: number) => void;
};

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

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 to-blue-950/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-white">📅 Ежедневная награда</h3>
        <div className="rounded-full bg-cyan-500/20 px-2 py-1 text-xs text-cyan-400">
          День {status.day_slot} / 7
        </div>
      </div>

      {status.can_claim ? (
        <button
          type="button"
          onClick={() => void handleClaim()}
          disabled={loading}
          className="tap-target w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3 font-medium text-white transition hover:scale-105 disabled:opacity-50"
        >
          {loading
            ? "Загрузка..."
            : `Забрать награду (день ${status.next_reward_day}) → +${status.reward_coins.toLocaleString("ru-RU")} 💰`}
          {status.reward_crystals > 0 && ` +${status.reward_crystals} 💎`}
        </button>
      ) : (
        <div className="rounded-xl bg-white/5 p-3 text-center text-sm text-zinc-400">
          {status.message || "Награда уже получена сегодня. Завтра будет следующая!"}
        </div>
      )}

      <div className="mt-3 flex justify-between text-xs text-zinc-500">
        <span>Макс. серия: {status.max_streak}</span>
        {status.last_claim_date && (
          <span>
            Последний забор:{" "}
            {new Date(status.last_claim_date).toLocaleDateString("ru-RU")}
          </span>
        )}
      </div>
    </div>
  );
}

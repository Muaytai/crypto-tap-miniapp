"use client";

import { useState, useEffect } from "react";
import { claimDailyReward, type PlayerState } from "@/lib/api";

type Props = {
  initData: string;
  onUpdate: (coins: number, crystals: number) => void;
};

type DailyStatus = {
  can_claim: boolean;
  current_streak: number;
  max_streak: number;
  last_claim_date: string | null;
  reward_coins: number;
  reward_crystals: number;
  message: string;
};

export function DailyReward({ initData, onUpdate }: Props) {
  const [status, setStatus] = useState<DailyStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStatus = async () => {
    try {
      const data = await claimDailyReward(initData);
      setStatus(data);
    } catch (err) {
      console.error("Failed to load daily reward:", err);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [initData]);

  const handleClaim = async () => {
    setLoading(true);
    try {
      const data = await claimDailyReward(initData);
      setStatus(data);
      if (data.can_claim && data.reward_coins > 0) {
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
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white">📅 Ежедневная награда</h3>
        <div className="rounded-full bg-cyan-500/20 px-2 py-1 text-xs text-cyan-400">
          Серия: {status.current_streak}
        </div>
      </div>

      {status.can_claim ? (
        <button
          onClick={handleClaim}
          disabled={loading}
          className="tap-target w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3 font-medium text-white transition hover:scale-105 disabled:opacity-50"
        >
          {loading
            ? "Загрузка..."
            : `Забрать награду (День ${status.current_streak + 1}) → +${status.reward_coins.toLocaleString("ru-RU")} 💰`}
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
          <span>Последний забор: {new Date(status.last_claim_date).toLocaleDateString("ru-RU")}</span>
        )}
      </div>
    </div>
  );
}
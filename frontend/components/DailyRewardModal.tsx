"use client";

import { useCallback, useEffect, useState } from "react";
import {
  claimDailyReward,
  fetchDailyRewardStatus,
  resolveDailyDaySchedule,
  type DailyRewardDaySlot,
  type DailyRewardStatus,
} from "@/lib/api";
import { playGameSound } from "@/lib/gameSounds";

function normalizeDailyError(error: unknown): string {
  if (!(error instanceof Error)) return "Не удалось загрузить награду";
  const raw = error.message?.trim();
  if (!raw) return "Не удалось загрузить награду";
  try {
    const parsed = JSON.parse(raw) as { detail?: string; error?: string };
    const detail = parsed.detail || parsed.error;
    if (detail) {
      if (/Authentication credentials were not provided/i.test(detail)) {
        return "Откройте мини-приложение из Telegram, чтобы получить награду.";
      }
      return detail;
    }
  } catch {
    // ignore JSON parse errors
  }
  if (/Authentication credentials were not provided/i.test(raw)) {
    return "Откройте мини-приложение из Telegram, чтобы получить награду.";
  }
  return raw;
}

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

function streakWord(n: number): string {
  const a = Math.abs(n) % 100;
  const l = a % 10;
  if (a > 10 && a < 20) return "дней";
  if (l === 1) return "день";
  if (l >= 2 && l <= 4) return "дня";
  return "дней";
}

type Props = {
  open: boolean;
  initData: string;
  onClose: () => void;
  onClaimed: (coins: number, crystals: number) => void;
  onStatusChange?: (canClaim: boolean) => void;
};

export function DailyRewardModal({
  open,
  initData,
  onClose,
  onClaimed,
  onStatusChange,
}: Props) {
  const [status, setStatus] = useState<DailyRewardStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchDailyRewardStatus(initData);
      setStatus(data);
      onStatusChange?.(data.can_claim);
    } catch (e) {
      console.error(e);
      setError(normalizeDailyError(e));
      setStatus(null);
    }
  }, [initData, onStatusChange]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  const handleClaim = async () => {
    if (!status?.can_claim) return;
    setLoading(true);
    setError(null);
    try {
      const data = await claimDailyReward(initData);
      setStatus(data);
      onStatusChange?.(data.can_claim);
      onClaimed(data.reward_coins, data.reward_crystals);
      playGameSound("success");
    } catch (e) {
      setError(normalizeDailyError(e));
      playGameSound("error");
      await load();
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const schedule = status ? resolveDailyDaySchedule(status) : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-8">
      <div
        className="w-full max-w-[380px] rounded-3xl border border-cyan-400/30 bg-[#0a0f1c] p-6 shadow-2xl animate-modal-slide-down"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-center font-pixel text-2xl text-cyan-300">ЕЖЕДНЕВНАЯ НАГРАДА</h2>

        {status && (
          <p className="mt-2 text-center text-sm text-cyan-400">
            Серия: <span className="font-bold">{status.streak_display}</span> дней
          </p>
        )}

        {error && <p className="mt-3 text-center text-red-400 text-sm">{error}</p>}

        <div className="mt-6 grid grid-cols-7 gap-2">
          {schedule.map((row) => {
            const isClaimable = row.status === "claimable" && status?.can_claim;
            const isClaimed = row.status === "claimed";

            return (
              <div
                key={row.day}
                className={`flex aspect-square flex-col items-center justify-center rounded-2xl border p-1 text-center transition-all ${
                  isClaimed
                    ? "border-emerald-400 bg-emerald-950/40"
                    : isClaimable
                    ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_12px_#22d3ee]"
                    : "border-white/10 bg-zinc-900/70"
                }`}
              >
                <span className="text-lg font-bold">{row.day}</span>
                <span className="text-[10px] text-cyan-300 mt-1">
                  {row.reward_coins || row.reward_crystals ? `+${row.reward_coins || ""}${row.reward_crystals ? "◆" : ""}` : "—"}
                </span>
              </div>
            );
          })}
        </div>

        {status?.can_claim && (
          <button
            onClick={handleClaim}
            disabled={loading}
            className="tap-target mt-6 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 py-4 text-lg font-bold text-white active:scale-95"
          >
            {loading ? "Получаем..." : "ЗАБРАТЬ НАГРАДУ"}
          </button>
        )}

        <button
          onClick={onClose}
          className="tap-target mt-3 w-full rounded-2xl border border-white/20 py-3 text-sm font-medium"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
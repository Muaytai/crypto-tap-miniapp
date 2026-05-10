"use client";

import { useCallback, useEffect, useState } from "react";
import {
  claimDailyReward,
  fetchDailyRewardStatus,
  resolveDailyDaySchedule,
  type DailyRewardDaySlot,
  type DailyRewardStatus,
} from "@/lib/api";

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
    } catch (e) {
      setError(normalizeDailyError(e));
      await load();
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const schedule = status ? resolveDailyDaySchedule(status) : [];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-reward-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-[360px] rounded-2xl border-2 border-sky-400/45 bg-[#161d2e] p-4 text-white shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="daily-reward-title"
          className="text-center text-lg font-semibold leading-tight tracking-tight text-white"
        >
          Заходи каждый день
        </h2>

        {status && (
          <p className="mt-3 text-center text-sm text-slate-300">
            Серия:{" "}
            <span className="font-semibold text-amber-300">
              {status.streak_display}
            </span>{" "}
            {streakWord(status.streak_display)} подряд
          </p>
        )}

        {error && (
          <p className="mt-2 text-center font-pixel text-[11px] text-red-300">{error}</p>
        )}

        {!status && !error && (
          <p className="mt-4 text-center text-sm text-slate-400">Загрузка…</p>
        )}

        {status && (
          <>
            <div className="mt-4 grid grid-cols-7 gap-1.5">
              {schedule.map((row) => {
                const isClaimable = row.status === "claimable" && status.can_claim;
                const isClaimed = row.status === "claimed";
                const cellClass = isClaimable
                  ? "border-amber-400/80 bg-amber-400/20 text-amber-50 shadow-[0_0_12px_rgba(251,191,36,0.35)]"
                  : isClaimed
                    ? "border-white/10 bg-slate-700/50 text-slate-200"
                    : "border-white/5 bg-[#252b3d] text-slate-500";

                return (
                  <div
                    key={row.day}
                    className={`flex min-h-[5.25rem] min-w-0 flex-col items-center justify-center rounded-lg border px-0.5 py-2 ${cellClass}`}
                  >
                    <span className="text-sm font-bold tabular-nums leading-none">{row.day}</span>
                    <span className="mt-1 line-clamp-2 text-center text-[10px] font-medium leading-snug opacity-95">
                      {rewardCaption(row)}
                    </span>
                    {isClaimed && <span className="mt-1 text-[11px] leading-none text-emerald-300/90">✓</span>}
                    {isClaimable && (
                      <span className="mt-1 text-[9px] uppercase tracking-wide text-amber-200/90">сегодня</span>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-center text-xs text-slate-400">
              {status.days_to_weekly_bonus > 0 ? (
                <>
                  До следующей награды:{" "}
                  <span className="font-semibold text-slate-200">
                    {status.days_to_weekly_bonus} {streakWord(status.days_to_weekly_bonus)}
                  </span>
                  {status.weekly_bonus_crystals > 0 && (
                    <span className="text-sky-300">
                      {" "}
                      (+{status.weekly_bonus_crystals}{" "}
                      <span aria-hidden>◆</span>)
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sky-300/90">Сегодня — день бонуса недели!</span>
              )}
            </p>

            {status.can_claim && (
              <p className="mt-2 text-center text-[11px] text-cyan-200/90">
                Сегодня: +
                {status.reward_coins.toLocaleString("ru-RU")} токенов
                {status.reward_crystals > 0 && (
                  <>
                    {" "}
                    +{status.reward_crystals} ◆
                  </>
                )}
              </p>
            )}

            {!status.can_claim && status.message && (
              <p className="mt-2 text-center text-[11px] text-slate-500">{status.message}</p>
            )}
          </>
        )}

        <div className="mt-5 flex flex-col gap-2">
          {status?.can_claim && (
            <button
              type="button"
              onClick={() => void handleClaim()}
              disabled={loading}
              className="tap-target w-full rounded-xl bg-gradient-to-b from-sky-500 to-sky-600 py-3 text-center text-sm font-semibold text-neutral-950 shadow-[0_4px_0_#0369a1] active:translate-y-px disabled:opacity-50"
            >
              {loading ? "…" : "Забрать награду"}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="tap-target w-full rounded-xl border-2 border-white/25 bg-[#1e2638] py-2.5 text-center text-sm font-medium text-white"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

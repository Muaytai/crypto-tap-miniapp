"use client";

import { useState, useEffect } from "react";
import { performPrestige, getPrestigeStatus, type PlayerState } from "@/lib/api";

type Props = {
  initData: string;
  playerState: PlayerState;
  onPrestige: (newState: PlayerState) => void;
};

export function PrestigePanel({ initData, playerState, onPrestige }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    can_prestige: boolean;
    total_earned_all_time: number;
    prestige_threshold: number;
    current_prestige_count: number;
    crystals: number;
  } | null>(null);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const data = await getPrestigeStatus(initData);
        setStatus(data);
      } catch (err) {
        console.error("Failed to load prestige status:", err);
      }
    };
    loadStatus();
  }, [initData, playerState.player.prestige_count]);

  const handlePrestige = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await performPrestige(initData);
      if (result.success) {
        // Обновляем состояние игрока (сброс)
        const updatedState = {
          ...playerState,
          player: {
            ...playerState.player,
            coins: 0,
            crystals: result.total_crystals,
            prestige_count: result.prestige_count,
          },
          items: playerState.items.map(item => ({ ...item, quantity: 0 })),
          upgrades: [],
          income_per_second: 0,
        };
        onPrestige(updatedState);
        // Обновляем статус
        setStatus(prev => prev ? {
          ...prev,
          can_prestige: false,
          current_prestige_count: result.prestige_count,
          crystals: result.total_crystals,
        } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка закалки");
    } finally {
      setLoading(false);
    }
  };

  if (!status) {
    return <div className="p-4 text-center text-zinc-500">Загрузка...</div>;
  }

  const progressPercent = Math.min(
    100,
    (status.total_earned_all_time / status.prestige_threshold) * 100
  );
  const needed = Math.max(0, status.prestige_threshold - status.total_earned_all_time);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 to-orange-950/30 p-4">
        <h2 className="text-lg font-semibold text-white">✨ Закалка / Престиж</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Сбросьте прогресс, получите алмазы и начните заново с бонусами
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Прогресс к закалке</span>
          <span className="text-cyan-400">
            {status.total_earned_all_time.toLocaleString("ru-RU")} / {status.prestige_threshold.toLocaleString("ru-RU")}
          </span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {needed > 0 && (
          <p className="mt-2 text-xs text-zinc-500">
            Осталось заработать {needed.toLocaleString("ru-RU")} монет
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">У вас алмазов</p>
            <p className="text-3xl font-bold text-purple-400">
              💎 {status.crystals.toLocaleString("ru-RU")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-400">Закалок совершено</p>
            <p className="text-2xl font-bold text-white">
              {status.current_prestige_count}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/20 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {status.can_prestige ? (
        <button
          onClick={handlePrestige}
          disabled={loading}
          className="tap-target w-full rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 py-4 text-lg font-bold text-white transition hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {loading ? "Закалка..." : "🔥 СДЕЛАТЬ ЗАКАЛКУ 🔥"}
        </button>
      ) : (
        <button
          disabled
          className="w-full rounded-2xl bg-zinc-800 py-4 text-lg font-bold text-zinc-500"
        >
          🔒 Закалка недоступна
        </button>
      )}

      <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/30 p-3">
        <p className="text-xs text-zinc-400">
          ⚡ После закалки вы получите алмазы, но потеряете все монеты, предметы и обычные улучшения.<br />
          💎 Алмазы и небесные апгрейды останутся с вами навсегда!
        </p>
      </div>
    </div>
  );
}
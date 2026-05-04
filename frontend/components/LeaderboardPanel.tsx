"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchLeaderboard, type LeaderboardMetric, type LeaderboardRow } from "@/lib/api";
import { formatIdleNumber } from "@/lib/formatIdleNumber";
import { CryptoTipBanner } from "@/components/CryptoTipBanner";

type Props = {
  initData: string;
};

const TABS: { id: LeaderboardMetric; label: string; icon?: string }[] = [
  { id: "earnings", label: "Заработок" },
  { id: "crystals", label: "Алмазы", icon: "💎" },
  { id: "prestige", label: "Закалки" },
];

function displayName(row: LeaderboardRow): string {
  const u = row.username?.trim();
  if (u) return `@${u}`;
  return row.first_name?.trim() || `id ${row.telegram_id}`;
}

function initials(row: LeaderboardRow): string {
  const n = row.first_name?.trim() || row.username?.trim() || "?";
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  }
  return n.slice(0, 2).toUpperCase();
}

function medalForRank(rank: number): string | null {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

function formatScore(metric: LeaderboardMetric, score: number): string {
  if (metric === "prestige") return Math.floor(score).toLocaleString("ru-RU");
  if (metric === "crystals") return formatIdleNumber(score);
  return formatIdleNumber(score);
}

export function LeaderboardPanel({ initData }: Props) {
  const [metric, setMetric] = useState<LeaderboardMetric>("earnings");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [meRank, setMeRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const visibleRows = rows.slice(0, 8);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (initData === "dev") {
        setRows([
          { rank: 1, telegram_id: 1, first_name: "Satoshi", username: "satoshi", photo_url: "", score: 13.2e24 },
          { rank: 2, telegram_id: 2, first_name: "Виталик", username: "", photo_url: "", score: 187.2e21 },
          { rank: 3, telegram_id: 3, first_name: "Dev", username: "dev", photo_url: "", score: 900e18 },
          { rank: 4, telegram_id: 4, first_name: "Player", username: "player", photo_url: "", score: 12e15 },
        ]);
        setTotalPlayers(16125);
        setMeRank(12365);
        return;
      }
      const data = await fetchLeaderboard(initData, metric, 50);
      setRows(data.results);
      setTotalPlayers(data.total_players);
      setMeRank(data.me_rank ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [initData, metric]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-3">
      <div className="shrink-0 px-3 pt-1">
        <p className="text-center font-pixel text-[10px] font-bold uppercase tracking-wider text-amber-200/60">
          Crypto Tap
        </p>
        <CryptoTipBanner seed={metric.charCodeAt(0) * 17} />
        <h1 className="mb-3 text-center font-pixel text-xl text-amber-50 sm:text-2xl">Рейтинг</h1>

        <div className="mb-3 flex border-2 border-amber-800/50 bg-[#120f0c] p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setMetric(t.id)}
              className={`tap-target font-pixel flex-1 px-2 py-2 text-center text-[10px] transition sm:text-[11px] ${
                metric === t.id
                  ? "bg-sky-700 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.12)]"
                  : "text-amber-200/50 hover:text-amber-100"
              }`}
            >
              {t.icon ? `${t.icon} ` : ""}
              {t.label}
            </button>
          ))}
        </div>

        {meRank != null && totalPlayers > 0 && (
          <div className="mb-3 border-2 border-sky-700/60 bg-sky-900/50 px-3 py-2.5 text-center font-pixel text-[11px] text-sky-100 sm:text-xs">
            Ваше место:{" "}
            <span className="font-bold text-amber-300">#{meRank.toLocaleString("ru-RU")}</span> из{" "}
            <span className="font-bold text-amber-300">{totalPlayers.toLocaleString("ru-RU")}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-3 rounded-xl bg-red-500/15 px-3 py-2 text-center text-sm text-red-300">{error}</div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden px-3">
        {loading ? (
          <p className="py-12 text-center text-zinc-500">Загрузка...</p>
        ) : (
          <ul className="flex flex-col gap-2 pb-2">
            {visibleRows.map((row) => {
              const medal = medalForRank(row.rank);
              return (
                <li
                  key={`${row.telegram_id}-${row.rank}`}
                  className="flex items-center gap-3 border-2 border-amber-700/35 bg-[#0f0c0a]/90 px-2 py-2 sm:px-3"
                >
                  <div className="flex w-9 shrink-0 justify-center text-center">
                    {medal ? (
                      <span className="text-xl" aria-label={`Место ${row.rank}`}>
                        {medal}
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-zinc-500">#{row.rank}</span>
                    )}
                  </div>
                  {row.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.photo_url}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600/50 to-blue-600/50 text-xs font-bold text-white">
                      {initials(row)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{displayName(row)}</p>
                  </div>
                  <p className="shrink-0 text-right font-pixel text-xs font-bold tabular-nums text-amber-300 sm:text-sm">
                    {formatScore(metric, row.score)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

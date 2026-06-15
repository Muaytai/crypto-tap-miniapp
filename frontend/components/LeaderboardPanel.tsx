"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchLeaderboard, type LeaderboardMetric, type LeaderboardRow, type PlayerState } from "@/lib/api";
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
  if (metric === "prestige") return formatIdleNumber(score);
  if (metric === "crystals") return formatIdleNumber(score);
  return formatIdleNumber(score);
}

function makeDevLeaderboard(metric: LeaderboardMetric, count = 60): {
  rows: LeaderboardRow[];
  totalPlayers: number;
  meRank: number;
} {
  const baseNames = [
    { first_name: "Satoshi", username: "satoshi" },
    { first_name: "Виталик", username: "" },
    { first_name: "Dev", username: "dev" },
    { first_name: "Player", username: "player" },
    { first_name: "Александр", username: "" },
    { first_name: "Кирилл", username: "" },
    { first_name: "Степан", username: "" },
    { first_name: "The", username: "the" },
    { first_name: "Антон", username: "" },
    { first_name: "Dmitry", username: "" },
    { first_name: "Максим", username: "" },
    { first_name: "Кристинка", username: "" },
  ];

  const scoreBase =
    metric === "prestige" ? 210 : metric === "crystals" ? 2.6e6 : 1.2e24;

  const rows: LeaderboardRow[] = Array.from({ length: count }, (_, i) => {
    const rank = i + 1;
    const n = baseNames[i % baseNames.length];
    const telegram_id = 1000 + rank;
    const username = n.username || (rank % 3 === 0 ? `user${rank}` : "");
    const first_name = n.first_name;

    // убывающий “псевдо‑реалистичный” скор без рандома, чтобы было детерминированно
    const decay = Math.pow(0.86, i);
    const wobble = 1 + ((i % 7) - 3) * 0.012;
    const score = Math.max(1, scoreBase * decay * wobble);

    return { rank, telegram_id, first_name, username, photo_url: "", score };
  });

  return { rows, totalPlayers: 16127, meRank: 12365 };
}

export function LeaderboardPanel({ initData }: Props) {
  const [metric, setMetric] = useState<LeaderboardMetric>("earnings");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [meRank, setMeRank] = useState<number | null>(null);
  const [me, setMe] = useState<PlayerState["player"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageClamped = Math.min(page, totalPages - 1);
  const startIdx = pageClamped * pageSize;
  const endIdx = startIdx + pageSize;
  const visibleRows = rows.slice(startIdx, endIdx);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (initData === "dev") {
        const dev = makeDevLeaderboard(metric, 80);
        setRows(dev.rows);
        setTotalPlayers(dev.totalPlayers);
        setMeRank(dev.meRank);
        setMe({
          telegram_id: 777,
          username: "dev",
          first_name: "Разработчик",
          coins: 100000,
          total_taps: 1000,
          crystals: 10,
          total_earned_all_time: 1000000,
          prestige_count: 7,
          max_offline_minutes: 180,
        });
        return;
      }
      const data = await fetchLeaderboard(initData, metric, 50);
      setRows(data.results);
      setTotalPlayers(data.total_players);
      setMeRank(data.me_rank ?? null);
      setMe(data.me ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [initData, metric]);

  useEffect(() => {
    // при смене метрики/данных возвращаемся на 1‑ю страницу
    setPage(0);
  }, [metric, initData]);

  useEffect(() => {
    const t = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(t);
  }, [load]);

  const meScore =
    me && (metric === "earnings" ? me.total_earned_all_time : metric === "crystals" ? me.crystals : me.prestige_count);

  return (
    <div className="flex h-full flex-col bg-[#0a0806] px-4 pb-6">
      {/* Header */}
      <div className="border-b border-cyan-500/10 pb-4 pt-5">
        <h1 className="font-pixel text-center text-3xl font-bold tracking-[0.15em] text-cyan-400 drop-shadow-[0_0_15px_#22d3ee]">
          ТОП ИГРОКОВ
        </h1>
        <p className="mt-1 text-center font-mono text-xs text-cyan-500/60">Соревнуйся • Поднимайся • Доминируй</p>
      </div>

      <div className="mt-5">
        <CryptoTipBanner
          seed={777}
          className="rounded-2xl border-white/10 bg-gradient-to-b from-[#0f1625] to-[#0a0f1c] p-3"
        />
      </div>

      {/* Табы */}
      <div className="mt-4 flex gap-1.5 rounded-2xl bg-black/60 p-1.5">
        {TABS.map((t) => {
          const isActive = metric === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setMetric(t.id)}
              className={`tap-target flex-1 rounded-xl py-3 text-sm font-pixel transition-all ${
                isActive
                  ? "bg-cyan-500 text-black shadow-[0_0_20px_#22d3ee]"
                  : "bg-zinc-900/80 text-cyan-400/70 hover:bg-zinc-800 hover:text-cyan-300"
              }`}
            >
              {t.icon} {t.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-950/50 p-3 text-center text-sm text-red-200 backdrop-blur-md">
          {error}
        </div>
      )}

      <div className="mt-6 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="font-mono text-cyan-400">Загрузка рейтинга...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Твоё место */}
            {meRank && me && meScore !== undefined && (
              <div className="rounded-3xl border border-cyan-400/30 bg-gradient-to-r from-cyan-950/60 to-transparent p-4">
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-cyan-400">#{meRank}</div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-white">
                      {me.username ? `@${me.username}` : me.first_name}
                    </p>
                    <p className="text-sm text-cyan-400">Ты здесь</p>
                  </div>
                  <div className="text-right font-mono text-2xl font-bold text-cyan-300">
                    {formatIdleNumber(meScore)}
                  </div>
                </div>
              </div>
            )}

            {/* Список */}
            <div className="space-y-2">
              {rows.map((row) => {
                const medal = medalForRank(row.rank);
                const isTop3 = row.rank <= 3;

                return (
                  <div
                    key={row.rank}
                    className={`flex items-center gap-4 rounded-3xl border p-4 transition-all ${
                      isTop3
                        ? "border-amber-400/40 bg-gradient-to-r from-amber-950/60 to-transparent"
                        : "border-white/10 bg-zinc-950/80 hover:border-cyan-500/30"
                    }`}
                  >
                    <div className="w-10 text-center">
                      {medal ? (
                        <span className="text-3xl">{medal}</span>
                      ) : (
                        <span className="font-pixel text-lg text-zinc-400">#{row.rank}</span>
                      )}
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600/30 to-blue-600/30 text-xl font-bold text-white">
                      {initials(row)}
                    </div>

                    <div className="min-w-0 flex-1 truncate">
                      <p className="font-medium text-white">{displayName(row)}</p>
                    </div>

                    <div className="text-right font-mono text-xl font-bold text-cyan-300">
                      {formatIdleNumber(row.score)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
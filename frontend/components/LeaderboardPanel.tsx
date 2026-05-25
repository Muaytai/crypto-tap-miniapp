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
    const username =
      n.username || (rank % 3 === 0 ? `user${rank}` : "");
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
    <div className="flex min-h-0 flex-1 flex-col pb-2">
      <div className="sticky top-0 z-20 shrink-0 bg-[#070b14]/92 px-3 pt-2 backdrop-blur-[8px]">
        <p className="text-center font-pixel text-[10px] font-bold uppercase tracking-wider text-cyan-200/50">
          Crypto Tap
        </p>
        <CryptoTipBanner
          seed={metric.charCodeAt(0) * 17}
          className="w-full rounded-2xl border-white/10 bg-gradient-to-b from-[#141b2a]/80 to-[#0b0f1a]/65 px-3 py-2 text-slate-100/85 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
        />
      </div>

      <div className="min-h-0 flex-1 px-3 pb-2">
        <h1 className="mb-3 mt-1 text-center font-pixel text-xl text-cyan-50 sm:text-2xl">Рейтинг</h1>
        <div className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-[#101626]/80 to-[#0b0f1a]/70 p-2 shadow-[0_18px_50px_-25px_rgba(0,0,0,0.85)]">
          <div className="relative mb-3 flex shrink-0 rounded-[18px] bg-[rgba(10,16,32,0.75)] p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
            {TABS.map((t) => {
              const on = metric === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setMetric(t.id)}
                  className={`tap-target relative flex-1 rounded-[14px] px-2 py-2 text-center font-pixel text-[10px] transition sm:text-[11px] ${
                    on
                      ? "-mt-0.5 pb-3 text-white shadow-[0_10px_22px_-16px_rgba(56,189,248,0.7),inset_0_2px_0_rgba(255,255,255,0.12)] [background:linear-gradient(to_bottom,#0ea5e9,#075985)] after:absolute after:bottom-[-10px] after:left-[10px] after:right-[10px] after:h-[14px] after:rounded-b-full after:[background:linear-gradient(to_bottom,#075985,transparent)] after:[filter:drop-shadow(0_10px_14px_rgba(0,0,0,0.35))]"
                      : "text-cyan-200/45 hover:text-cyan-100/80"
                  }`}
                >
                  {t.icon ? `${t.icon} ` : ""}
                  {t.label}
                </button>
              );
            })}
          </div>

          {meRank != null && totalPlayers > 0 && (
            <div className="mb-3 shrink-0 rounded-2xl border border-sky-400/20 bg-gradient-to-b from-sky-700/55 to-sky-900/35 px-3 py-3 text-center font-pixel text-[11px] text-sky-50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] sm:text-xs">
              Ваше место:{" "}
              <span className="font-bold text-cyan-300">#{meRank.toLocaleString("ru-RU")}</span> из{" "}
              <span className="font-bold text-cyan-300">{totalPlayers.toLocaleString("ru-RU")}</span>
            </div>
          )}

          {error && (
            <div className="mb-3 shrink-0 rounded-xl bg-red-500/15 px-3 py-2 text-center text-sm text-red-300">{error}</div>
          )}

          <div className="min-h-0 flex-1 overflow-hidden">
            {loading ? (
              <p className="py-12 text-center text-zinc-400">Загрузка...</p>
            ) : (
              <div className="min-h-0 flex-1">
                <ul className="flex flex-col gap-2 pb-2">
                  {visibleRows.map((row) => {
                    const medal = medalForRank(row.rank);
                    const isTop3 = row.rank <= 3;
                    return (
                      <li
                        key={`${row.telegram_id}-${row.rank}`}
                        className={`flex items-center gap-3 rounded-2xl px-2.5 py-2.5 sm:px-3 ${
                          isTop3
                            ? "bg-gradient-to-b from-cyan-500/10 via-[#1a1f2d]/70 to-[#101522]/70 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.22),0_10px_24px_-22px_rgba(251,191,36,0.55)]"
                            : "bg-gradient-to-b from-[#1a1f2d]/70 to-[#101522]/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                        }`}
                      >
                        <div className="flex w-10 shrink-0 justify-center text-center">
                          {medal ? (
                            <span className="text-xl" aria-label={`Место ${row.rank}`}>
                              {medal}
                            </span>
                          ) : (
                            <span className="font-pixel text-[11px] text-zinc-400">#{row.rank}</span>
                          )}
                        </div>
                        {row.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.photo_url}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-xl border border-white/10 object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/60 to-blue-600/60 text-xs font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)]">
                            {initials(row)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-white">{displayName(row)}</p>
                        </div>
                        <p className="shrink-0 text-right font-pixel text-xs font-bold tabular-nums text-cyan-300 sm:text-sm">
                          {formatScore(metric, row.score)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 z-10 shrink-0 bg-gradient-to-b from-transparent via-[#0b0f1a]/70 to-[#0b0f1a]/90 pt-1">
            {!loading && meRank != null && me && meScore != null && (
              <div className="mb-2 mt-1 flex items-center gap-3 rounded-2xl bg-gradient-to-b from-sky-700/35 to-sky-900/25 px-2.5 py-2.5 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.22)] sm:px-3">
                <div className="flex w-10 shrink-0 justify-center text-center">
                  <span className="font-pixel text-[11px] text-sky-100">#{meRank.toLocaleString("ru-RU")}</span>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/65 to-cyan-500/65 text-xs font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]">
                  {(me.first_name?.trim()?.[0] || me.username?.trim()?.[0] || "?").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{me.username ? `@${me.username}` : me.first_name}</p>
                </div>
                <p className="shrink-0 text-right font-pixel text-xs font-bold tabular-nums text-cyan-300 sm:text-sm">
                  {formatScore(metric, meScore)}
                </p>
              </div>
            )}

            {!loading && rows.length > pageSize && (
              <div className="mt-1 flex items-center justify-center gap-2 pb-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={pageClamped <= 0}
                  className="tap-target rounded-lg border border-white/10 bg-black/80 px-3 py-2 text-xs text-zinc-200 disabled:opacity-40"
                  aria-label="Предыдущая страница"
                >
                  ‹
                </button>
                <div className="rounded-lg border border-white/10 bg-black/80 px-3 py-2 text-xs text-zinc-300">
                  стр. <span className="font-semibold text-white">{pageClamped + 1}</span> из{" "}
                  <span className="font-semibold text-white">{totalPages}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={pageClamped >= totalPages - 1}
                  className="tap-target rounded-lg border border-white/10 bg-black/80 px-3 py-2 text-xs text-zinc-200 disabled:opacity-40"
                  aria-label="Следующая страница"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

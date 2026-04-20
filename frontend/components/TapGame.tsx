"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, apiFetchWithRetry, fetchPublicJson } from "@/lib/api";
import {
  dockTabFromHash,
  getTelegramWebApp,
  historyUrlForDockTab,
  watchTelegramInitData,
} from "@/lib/telegram";
import { PowercxtGame } from "@/components/powercxt/PowercxtGame";
import { type DockTab, PowercxtShell } from "@/components/PowercxtShell";

type Player = {
  telegram_id: number;
  username: string;
  first_name: string;
  photo_url: string;
  total_taps: number;
  coins: number;
  referred_by_id: number | null;
};

type TgUser = {
  id?: number;
  first_name?: string;
  username?: string;
  photo_url?: string;
};

type LeaderboardRow = {
  rank: number;
  telegram_id: number;
  first_name: string;
  username: string;
  photo_url: string;
  total_taps: number;
  coins: number;
};

type LeaderboardPayload = {
  results: LeaderboardRow[];
  me_rank?: number;
  me?: Player;
};

function formatApiError(message: string): string {
  const t = message.trim();
  if (
    t === "Failed to fetch" ||
    t === "Load failed" ||
    t === "NetworkError when attempting to fetch resource."
  ) {
    return "Сейчас не удаётся загрузить данные. Попробуйте позже.";
  }
  return message;
}

export function TapGame() {
  const [initData, setInitData] = useState("");
  const [player, setPlayer] = useState<Player | null>(null);
  const [pendingDisplay, setPendingDisplay] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dockTab, setDockTab] = useState<DockTab>("game");
  const [leaderboard, setLeaderboard] = useState<LeaderboardPayload | null>(null);
  const [lbLoading, setLbLoading] = useState(false);
  const [lbError, setLbError] = useState<string | null>(null);
  const [publicBotUsername, setPublicBotUsername] = useState<string | null>(null);
  const syncing = useRef(false);
  const pendingRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = (await fetchPublicJson("/api/public-config/")) as {
          telegram_bot_username?: string;
        };
        const u = (d.telegram_bot_username || "").replace(/^@/, "").trim();
        if (!cancelled && u) setPublicBotUsername(u);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return watchTelegramInitData((raw) => {
      setInitData(raw);
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDockTab(dockTabFromHash());
    const onHash = () => setDockTab(dockTabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const goTab = useCallback((t: DockTab) => {
    setDockTab(t);
    const path = window.location.pathname + window.location.search;
    window.history.replaceState(null, "", historyUrlForDockTab(path, t));
  }, []);

  const loadMe = useCallback(async () => {
    if (!initData) return;
    setLoading(true);
    try {
      const data = (await apiFetch("/api/me/", {
        initData,
      })) as Player;
      setPlayer(data);
    } catch {
      /* тихо: профиль с сервера подтянется после синхронизации тапов */
    } finally {
      setLoading(false);
    }
  }, [initData]);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  const flushPending = useCallback(async () => {
    const toSend = pendingRef.current;
    if (!initData || toSend <= 0 || syncing.current) return;
    syncing.current = true;
    pendingRef.current = 0;
    setPendingDisplay(0);
    try {
      const data = (await apiFetch("/api/taps/sync/", {
        method: "POST",
        initData,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taps_delta: toSend }),
      })) as Player;
      setPlayer(data);
    } catch {
      pendingRef.current += toSend;
      setPendingDisplay(pendingRef.current);
    } finally {
      syncing.current = false;
    }
  }, [initData]);

  useEffect(() => {
    if (!initData) return;
    const id = window.setInterval(() => {
      void flushPending();
    }, 4000);
    return () => window.clearInterval(id);
  }, [initData, flushPending]);

  useEffect(() => {
    if (!initData) return;
    const onVis = () => {
      if (document.visibilityState === "hidden") void flushPending();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [initData, flushPending]);

  useEffect(() => {
    if (dockTab !== "top") return;
    let cancelled = false;
    (async () => {
      setLbLoading(true);
      setLbError(null);
      try {
        const data = (await apiFetchWithRetry("/api/leaderboard/?limit=20", {
          initData: initData || undefined,
        })) as LeaderboardPayload;
        if (!cancelled) setLeaderboard(data);
      } catch (e) {
        if (!cancelled) {
          setLeaderboard(null);
          setLbError(e instanceof Error ? e.message : "Не удалось загрузить топ");
        }
      } finally {
        if (!cancelled) setLbLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dockTab, initData]);

  const reportTap = useCallback((n: number = 1) => {
    pendingRef.current += n;
    setPendingDisplay(pendingRef.current);
  }, []);

  const totalDisplay = (player?.total_taps ?? 0) + pendingDisplay;

  const twa = typeof window !== "undefined" ? getTelegramWebApp() : undefined;
  const tgUser = (twa?.initDataUnsafe?.user ?? {}) as TgUser;
  const botName =
    (
      publicBotUsername ||
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ||
      ""
    )
      .replace(/^@/, "")
      .trim() || null;
  const refLink =
    botName && tgUser.id != null
      ? `https://t.me/${botName}?startapp=ref_${tgUser.id}`
      : null;

  const copyRef = async () => {
    if (!refLink) return;
    try {
      await navigator.clipboard.writeText(refLink);
      getTelegramWebApp()?.HapticFeedback?.notificationOccurred?.("success");
    } catch {
      /* ignore */
    }
  };

  const headerLine =
    dockTab === "game" && initData && player
      ? `тапов ${totalDisplay.toLocaleString("ru-RU")} · монет ${player.coins.toLocaleString("ru-RU")}`
      : dockTab === "game" && initData && loading
        ? "загрузка…"
        : undefined;

  const shellHero =
    dockTab === "profile"
      ? { title: "профиль", tagline: "прогресс, монеты и приглашения" }
      : dockTab === "top"
        ? { title: "топ", tagline: "лучшие игроки по числу тапов" }
        : { title: "игра", tagline: "Тапай, проходи этапы, копи монеты" };

  const myTelegramId = tgUser.id;

  return (
    <PowercxtShell
      tab={dockTab}
      onTab={goTab}
      headerLine={headerLine}
      heroTitle={shellHero.title}
      heroTagline={shellHero.tagline}
    >
      {dockTab === "game" && (
        <>
          <PowercxtGame
            reportTap={reportTap}
            serverPlayer={player}
            hasServerAuth={!!initData}
            referralLink={refLink}
            onOpenTop={() => goTab("top")}
            onRunComplete={() => {
              void flushPending();
            }}
          />
        </>
      )}

      {dockTab === "profile" && (
        <div className="flex w-full min-w-0 flex-col gap-3 min-[400px]:gap-4">
          <div className="rounded-2xl border border-violet-500/20 bg-black/40 p-3 backdrop-blur-md min-[400px]:p-4">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
              Профиль
            </h2>
            <div className="mt-3 flex items-center gap-3">
              {player?.photo_url || tgUser.photo_url ? (
                <img
                  src={player?.photo_url || tgUser.photo_url}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-violet-500/35"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-violet-600/35 text-lg font-semibold text-violet-200">
                  {(player?.first_name ||
                    tgUser.first_name ||
                    tgUser.username ||
                    player?.username ||
                    "?")
                    .toString()
                    .slice(0, 1)
                    .toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium text-white">
                  {player?.first_name ||
                    tgUser.first_name ||
                    (tgUser.username ? `@${tgUser.username}` : "") ||
                    (player?.username ? `@${player.username}` : "") ||
                    "игрок"}
                </p>
                {(tgUser.username || player?.username) && (
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    @{(player?.username || tgUser.username || "").replace(/^@/, "")}
                  </p>
                )}
              </div>
            </div>
            {initData && (
              <>
                {loading && <p className="mt-2 text-zinc-500">Загрузка…</p>}
                {player && (
                  <dl className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs min-[400px]:mt-4 min-[400px]:gap-3">
                    <div className="min-w-0 rounded-xl border border-white/10 bg-white/5 px-2 py-2 min-[400px]:px-3">
                      <dt className="text-zinc-500">тапы</dt>
                      <dd className="text-base tabular-nums text-white min-[400px]:text-lg">
                        {player.total_taps.toLocaleString("ru-RU")}
                      </dd>
                    </div>
                    <div className="min-w-0 rounded-xl border border-white/10 bg-white/5 px-2 py-2 min-[400px]:px-3">
                      <dt className="text-zinc-500">монеты</dt>
                      <dd className="text-base tabular-nums text-cyan-300 min-[400px]:text-lg">
                        {player.coins.toLocaleString("ru-RU")}
                      </dd>
                    </div>
                  </dl>
                )}
              </>
            )}
            {!initData && (
              <p className="mt-2 text-sm text-zinc-500">
                Откройте из Telegram, чтобы видеть прогресс на сервере.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 to-violet-950/30 p-3 min-[400px]:p-4">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-cyan-300">
              Пригласить друзей
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              Поделитесь ссылкой — друг зайдёт в игру, реферал сохранится на сервере.
            </p>
            {refLink ? (
              <>
                <code className="mt-3 block break-all rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11px] text-zinc-300">
                  {refLink}
                </code>
                <button
                  type="button"
                  onClick={() => void copyRef()}
                  className="powercxt-tap-target mt-3 w-full min-h-[48px] rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-3 text-sm font-semibold text-white shadow-lg transition active:scale-[0.99]"
                >
                  Копировать ссылку
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}

      {dockTab === "top" && (
        <div className="flex w-full min-w-0 flex-col gap-3">
          {lbLoading && (
            <p className="rounded-2xl border border-white/10 bg-black/35 px-4 py-8 text-center text-sm text-zinc-400">
              Загрузка рейтинга…
            </p>
          )}
          {lbError && (
            <p className="rounded-2xl border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-center text-sm leading-relaxed text-rose-200">
              {formatApiError(lbError)}
            </p>
          )}
          {!lbLoading && !lbError && leaderboard && leaderboard.results.length === 0 && (
            <p className="rounded-2xl border border-white/10 bg-black/35 px-4 py-8 text-center text-sm text-zinc-400">
              Пока нет игроков в базе. Сыграйте и синхронизируйте тапы из Telegram.
            </p>
          )}
          {!lbLoading && !lbError && leaderboard && leaderboard.results.length > 0 && (
            <div className="w-full min-w-0 rounded-2xl border border-white/10 bg-black/35 p-2 backdrop-blur-sm min-[400px]:p-3">
              <ul className="flex flex-col gap-1">
                {leaderboard.results.map((row) => {
                  const isMe = myTelegramId != null && row.telegram_id === myTelegramId;
                  return (
                    <li
                      key={row.telegram_id}
                      className={`flex min-w-0 items-center gap-2 rounded-xl px-2 py-2 text-xs min-[400px]:gap-3 min-[400px]:px-3 min-[400px]:py-2.5 min-[400px]:text-sm ${
                        isMe
                          ? "border border-violet-500/40 bg-violet-950/35"
                          : "border border-transparent bg-white/[0.03]"
                      }`}
                    >
                      <span className="w-5 shrink-0 text-center font-mono text-[10px] tabular-nums text-zinc-500 min-[400px]:w-6 min-[400px]:text-xs">
                        {row.rank}
                      </span>
                      {row.photo_url ? (
                        <img
                          src={row.photo_url}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/10 min-[400px]:h-10 min-[400px]:w-10"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-700/80 text-[11px] font-bold text-zinc-300 min-[400px]:h-10 min-[400px]:w-10 min-[400px]:text-xs">
                          {(row.first_name || row.username || "?").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-medium leading-snug text-zinc-100">
                          {row.first_name || row.username || "игрок"}
                          {row.username ? (
                            <span className="font-normal text-zinc-500"> · @{row.username}</span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] leading-snug tabular-nums text-zinc-500 min-[400px]:text-[11px]">
                          {row.total_taps.toLocaleString("ru-RU")} тапов ·{" "}
                          <span className="text-cyan-400/90">{row.coins.toLocaleString("ru-RU")}</span>{" "}
                          монет
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {leaderboard.me_rank != null &&
                leaderboard.me &&
                !leaderboard.results.some(
                  (r) => myTelegramId != null && r.telegram_id === myTelegramId,
                ) && (
                  <p className="mt-3 border-t border-white/10 pt-3 text-center text-xs text-zinc-400">
                    Ваша позиция:{" "}
                    <span className="font-mono font-semibold text-violet-300">
                      #{leaderboard.me_rank}
                    </span>{" "}
                    · {leaderboard.me.total_taps.toLocaleString("ru-RU")} тапов
                  </p>
                )}
            </div>
          )}
        </div>
      )}
    </PowercxtShell>
  );
}

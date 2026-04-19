"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getTelegramWebApp } from "@/lib/telegram";
import { PowercxtGame } from "@/components/powercxt/PowercxtGame";
import { type DockTab, PowercxtShell } from "@/components/PowercxtShell";

type Player = {
  telegram_id: number;
  username: string;
  first_name: string;
  total_taps: number;
  coins: number;
  referred_by_id: number | null;
};

type TgUser = {
  id?: number;
  first_name?: string;
  username?: string;
};

export function TapGame() {
  const [initData, setInitData] = useState("");
  const [player, setPlayer] = useState<Player | null>(null);
  const [pendingDisplay, setPendingDisplay] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dockTab, setDockTab] = useState<DockTab>("game");
  const syncing = useRef(false);
  const pendingRef = useRef(0);

  useEffect(() => {
    const twa = getTelegramWebApp();
    if (twa) {
      twa.ready();
      twa.expand();
      setInitData(twa.initData || "");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#profile") {
      setDockTab("profile");
    }
    const onHash = () => {
      setDockTab(window.location.hash === "#profile" ? "profile" : "game");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const goTab = useCallback((t: DockTab) => {
    setDockTab(t);
    const path = window.location.pathname + window.location.search;
    if (t === "profile") {
      window.history.replaceState(null, "", `${path}#profile`);
    } else {
      window.history.replaceState(null, "", path);
    }
  }, []);

  const loadMe = useCallback(async () => {
    if (!initData) return;
    setLoading(true);
    setError(null);
    try {
      const data = (await apiFetch("/api/me/", {
        initData,
      })) as Player;
      setPlayer(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить профиль");
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
    } catch (e) {
      pendingRef.current += toSend;
      setPendingDisplay(pendingRef.current);
      setError(e instanceof Error ? e.message : "Ошибка синхронизации");
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

  const reportTap = useCallback((n: number = 1) => {
    pendingRef.current += n;
    setPendingDisplay(pendingRef.current);
  }, []);

  const totalDisplay = (player?.total_taps ?? 0) + pendingDisplay;

  const twa = typeof window !== "undefined" ? getTelegramWebApp() : undefined;
  const tgUser = (twa?.initDataUnsafe?.user ?? {}) as TgUser;
  const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, "");
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
    dockTab === "game" && initData && player && !error
      ? `тапов ${totalDisplay.toLocaleString("ru-RU")} · монет ${player.coins.toLocaleString("ru-RU")}`
      : dockTab === "game" && initData && loading
        ? "загрузка…"
        : undefined;

  return (
    <PowercxtShell tab={dockTab} onTab={goTab} headerLine={headerLine}>
      {dockTab === "game" && (
        <>
          {!initData && (
            <p className="rounded-2xl border border-amber-500/25 bg-amber-950/40 px-3 py-3 text-center text-sm text-amber-100">
              Откройте приложение из Telegram — без{" "}
              <code className="rounded bg-black/30 px-1 font-mono text-xs">initData</code>{" "}
              счёт на сервер не сохранится. В браузере игра всё равно работает.
            </p>
          )}

          {initData && (
            <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-center text-sm shadow-lg backdrop-blur-sm">
              {loading && <p className="text-zinc-400">Загрузка…</p>}
              {error && <p className="text-rose-400">{error}</p>}
              {player && !error && (
                <p className="text-zinc-300">
                  На сервере:{" "}
                  <span className="font-semibold tabular-nums text-white">
                    {totalDisplay.toLocaleString("ru-RU")}
                  </span>{" "}
                  тапов ·{" "}
                  <span className="tabular-nums text-cyan-300">{player.coins}</span> монет
                </p>
              )}
              {pendingDisplay > 0 && (
                <button
                  type="button"
                  onClick={() => void flushPending()}
                  className="mt-2 text-sm font-medium text-violet-300 underline decoration-violet-500/50"
                >
                  Отправить сейчас ({pendingDisplay})
                </button>
              )}
            </div>
          )}

          <PowercxtGame reportTap={reportTap} />
        </>
      )}

      {dockTab === "profile" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-violet-500/20 bg-black/40 p-4 backdrop-blur-md">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
              Профиль
            </h2>
            <p className="mt-3 text-sm">
              <span className="text-white">
                {tgUser.first_name ||
                  (tgUser.username ? `@${tgUser.username}` : "игрок")}
              </span>
              {tgUser.first_name && tgUser.username ? (
                <span className="text-zinc-500"> · @{tgUser.username}</span>
              ) : null}
            </p>
            {initData && (
              <>
                {loading && <p className="mt-2 text-zinc-500">Загрузка…</p>}
                {error && <p className="mt-2 text-rose-400">{error}</p>}
                {player && !error && (
                  <dl className="mt-4 grid grid-cols-2 gap-3 font-mono text-xs">
                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <dt className="text-zinc-500">тапы</dt>
                      <dd className="text-lg text-white tabular-nums">
                        {player.total_taps.toLocaleString("ru-RU")}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <dt className="text-zinc-500">монеты</dt>
                      <dd className="text-lg text-cyan-300 tabular-nums">
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

          <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 to-violet-950/30 p-4">
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
                  className="mt-3 w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-3 text-sm font-semibold text-white shadow-lg transition active:scale-[0.99]"
                >
                  Копировать ссылку
                </button>
              </>
            ) : (
              <p className="mt-3 text-sm text-amber-200/90">
                Добавьте в <code className="rounded bg-black/30 px-1 font-mono text-xs">.env.local</code>{" "}
                переменную{" "}
                <code className="rounded bg-black/30 px-1 font-mono text-xs">
                  NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
                </code>{" "}
                (имя бота без @) — здесь появится реферальная ссылка.
              </p>
            )}
          </div>
        </div>
      )}

      {dockTab === "top" && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/35 px-6 py-16 text-center backdrop-blur-sm">
          <p className="font-mono text-4xl">◎</p>
          <h2 className="mt-4 bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text text-xl font-bold text-transparent">
            Рейтинг
          </h2>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-400">
            Глобальная таблица лидеров появится позже. Пока сравнивайте счёт во вкладке «Игра».
          </p>
        </div>
      )}
    </PowercxtShell>
  );
}

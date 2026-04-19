"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getTelegramWebApp } from "@/lib/telegram";
import { PowercxtGame } from "@/components/powercxt/PowercxtGame";

type Player = {
  telegram_id: number;
  username: string;
  first_name: string;
  total_taps: number;
  coins: number;
  referred_by_id: number | null;
};

export function TapGame() {
  const [initData, setInitData] = useState("");
  const [player, setPlayer] = useState<Player | null>(null);
  const [pendingDisplay, setPendingDisplay] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      {!initData && (
        <p className="mx-4 rounded-lg bg-amber-50 px-3 py-2 text-center text-sm text-amber-900">
          Откройте из Telegram — для синхронизации очков на сервер нужен{" "}
          <code className="rounded bg-amber-100 px-1">initData</code>. Игра работает и без
          этого.
        </p>
      )}

      {initData && (
        <div className="mx-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-center text-sm shadow-sm">
          {loading && <p className="text-zinc-500">Профиль…</p>}
          {error && <p className="text-red-600">{error}</p>}
          {player && !error && (
            <p className="text-zinc-600">
              Всего на сервере:{" "}
              <span className="font-semibold tabular-nums text-zinc-900">{totalDisplay}</span>{" "}
              тапов · монеты {player.coins}
            </p>
          )}
          {pendingDisplay > 0 && (
            <button
              type="button"
              onClick={() => void flushPending()}
              className="mt-2 text-indigo-600 underline"
            >
              Сохранить сейчас ({pendingDisplay})
            </button>
          )}
        </div>
      )}

      <PowercxtGame reportTap={reportTap} />
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getTelegramWebApp } from "@/lib/telegram";

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

  const onTap = () => {
    pendingRef.current += 1;
    setPendingDisplay(pendingRef.current);
  };

  const totalDisplay = (player?.total_taps ?? 0) + pendingDisplay;

  return (
    <div className="flex w-full max-w-md flex-col gap-6 px-4 py-8">
      <header className="text-center">
        <p className="text-sm uppercase tracking-wide text-zinc-500">Crypto Tap</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Тапалка</h1>
        {!initData && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Откройте мини-приложение из Telegram — так сервер получит{" "}
            <code className="rounded bg-amber-100 px-1">initData</code> для синхронизации
            очков.
          </p>
        )}
      </header>

      <div className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-500">Всего тапов</p>
        <p className="text-4xl font-bold tabular-nums text-zinc-900">{totalDisplay}</p>
        {player && (
          <p className="text-sm text-zinc-600">
            Монеты: <span className="font-medium">{player.coins}</span>
          </p>
        )}
        {loading && <p className="text-xs text-zinc-400">загрузка…</p>}
        {error && <p className="text-center text-sm text-red-600">{error}</p>}
      </div>

      <button
        type="button"
        onClick={onTap}
        className="mx-auto flex h-44 w-44 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-semibold text-white shadow-lg transition active:scale-95"
      >
        ТАП!
      </button>

      {initData && pendingDisplay > 0 && (
        <button
          type="button"
          onClick={() => void flushPending()}
          className="text-center text-sm text-indigo-600 underline"
        >
          Сохранить сейчас ({pendingDisplay})
        </button>
      )}
    </div>
  );
}

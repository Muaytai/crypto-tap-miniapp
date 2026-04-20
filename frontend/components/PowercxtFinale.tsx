"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPublicJson } from "@/lib/api";
import { getPowercxtRegistrationUrl } from "@/lib/powercxt";
import { POWERCXT_STAGES } from "@/lib/powercxt-stages";
import { getTelegramWebApp } from "@/lib/telegram";

type LeaderboardPreviewRow = {
  rank: number;
  telegram_id: number;
  first_name: string;
  username: string;
  photo_url: string;
  total_taps: number;
  coins: number;
};

type Props = {
  onNewGame: () => void;
  onOpenTop: () => void;
  sessionTaps: number;
  serverPlayer: { total_taps: number; coins: number } | null;
  hasServerAuth: boolean;
  referralLink: string | null;
};

export function PowercxtFinale({
  onNewGame,
  onOpenTop,
  sessionTaps,
  serverPlayer,
  hasServerAuth,
  referralLink,
}: Props) {
  const url = getPowercxtRegistrationUrl();
  const stagesTotal = POWERCXT_STAGES.length;

  const [topPreview, setTopPreview] = useState<LeaderboardPreviewRow[] | null>(null);
  const [topPreviewLoading, setTopPreviewLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTopPreviewLoading(true);
      try {
        const d = (await fetchPublicJson("/api/leaderboard/?limit=8")) as {
          results?: LeaderboardPreviewRow[];
        };
        if (!cancelled) setTopPreview(d.results ?? []);
      } catch {
        if (!cancelled) setTopPreview(null);
      } finally {
        if (!cancelled) setTopPreviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openRegistration = () => {
    const twa = getTelegramWebApp();
    if (twa && typeof twa.openLink === "function") {
      twa.openLink(url);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const copyReferral = useCallback(async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      getTelegramWebApp()?.HapticFeedback?.notificationOccurred?.("success");
    } catch {
      /* ignore */
    }
  }, [referralLink]);

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-md flex-col gap-4 px-0 py-3 min-[400px]:gap-5 min-[400px]:px-1 sm:px-2">
      <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-b from-violet-950/40 to-black/35 px-3 py-5 shadow-[0_0_48px_rgba(88,28,135,0.15)] backdrop-blur-md min-[400px]:px-4 min-[400px]:py-6 sm:px-6">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400/90 min-[400px]:text-[11px] min-[400px]:tracking-[0.28em]">
          финиш
        </p>
        <h1 className="mt-2 text-center text-xl font-semibold leading-tight text-white min-[400px]:text-2xl">
          Все этапы пройдены
        </h1>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-left min-[400px]:p-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-violet-300">
            Результаты
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-500">Этапов</dt>
              <dd className="tabular-nums text-white">{stagesTotal}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-500">Тапов за прохождение</dt>
              <dd className="tabular-nums font-semibold text-cyan-300">
                {sessionTaps.toLocaleString("ru-RU")}
              </dd>
            </div>
            {hasServerAuth && serverPlayer ? (
              <>
                <div className="flex justify-between gap-2 border-t border-white/10 pt-2">
                  <dt className="text-zinc-500">Всего на сервере</dt>
                  <dd className="tabular-nums text-white">
                    {serverPlayer.total_taps.toLocaleString("ru-RU")} тапов
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500">Монеты</dt>
                  <dd className="tabular-nums text-cyan-300">
                    {serverPlayer.coins.toLocaleString("ru-RU")}
                  </dd>
                </div>
              </>
            ) : (
              <p className="border-t border-white/10 pt-2 text-xs leading-relaxed text-zinc-500">
                Откройте мини-апп из Telegram с тем же ботом — тапы начнут сохраняться в профиле и
                попадут в рейтинг.
              </p>
            )}
          </dl>
        </div>

        {referralLink ? (
          <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-left min-[400px]:p-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-cyan-300">
              Пригласить друзей
            </p>
            <code className="mt-2 block break-all rounded-lg border border-white/10 bg-black/40 px-2 py-2 font-mono text-[10px] text-zinc-300 min-[400px]:text-[11px]">
              {referralLink}
            </code>
            <button
              type="button"
              onClick={() => void copyReferral()}
              className="powercxt-tap-target mt-2 w-full min-h-[44px] rounded-xl bg-gradient-to-r from-violet-600/90 to-cyan-600/90 py-2.5 text-xs font-semibold text-white min-[400px]:text-sm"
            >
              Копировать реферальную ссылку
            </button>
          </div>
        ) : null}

        <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3 min-[400px]:p-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Топ игроков
          </p>
          {topPreviewLoading && (
            <p className="mt-2 text-xs text-zinc-500">Загрузка…</p>
          )}
          {!topPreviewLoading && topPreview && topPreview.length === 0 && (
            <p className="mt-2 text-xs text-zinc-500">Пока нет записей в рейтинге.</p>
          )}
          {!topPreviewLoading && topPreview && topPreview.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1.5">
              {topPreview.map((row) => (
                <li
                  key={row.telegram_id}
                  className="flex items-center justify-between gap-2 text-xs min-[400px]:text-sm"
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="w-4 shrink-0 font-mono text-zinc-500">{row.rank}</span>
                    {row.photo_url ? (
                      <img
                        src={row.photo_url}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-7 w-7 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-bold text-zinc-300">
                        {(row.first_name || row.username || "?").slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0 truncate text-zinc-300">
                      {row.first_name || row.username || "игрок"}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono tabular-nums text-cyan-400/90">
                    {row.total_taps.toLocaleString("ru-RU")}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {!topPreviewLoading && topPreview === null && (
            <p className="mt-2 text-xs text-zinc-500">
              Не удалось загрузить таблицу. Проверьте, что запущены серверы приложения.
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              getTelegramWebApp()?.HapticFeedback?.impactOccurred?.("light");
              onOpenTop();
            }}
            className="powercxt-tap-target mt-3 w-full min-h-[44px] rounded-xl border border-violet-500/35 bg-violet-950/30 py-2.5 text-xs font-semibold text-violet-200 min-[400px]:text-sm"
          >
            Открыть полный рейтинг
          </button>
        </div>

        <p className="mt-4 text-left text-xs leading-relaxed text-zinc-400 min-[400px]:text-sm">
          Создайте аккаунт на платформе и заберите приветственный бонус — например,{" "}
          <span className="font-medium text-cyan-200">500 токенов CXT</span>. Точные условия
          начисления указаны на сайте.
        </p>
      </div>

      <div className="flex w-full min-w-0 flex-col gap-2.5 min-[400px]:gap-3">
        <button
          type="button"
          onClick={() => {
            getTelegramWebApp()?.HapticFeedback?.impactOccurred?.("medium");
            onNewGame();
          }}
          className="powercxt-tap-target w-full min-h-[48px] rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition active:scale-[0.99] min-[400px]:px-6 min-[400px]:py-4 min-[400px]:text-base"
        >
          Новая игра
        </button>
        <button
          type="button"
          onClick={() => {
            getTelegramWebApp()?.HapticFeedback?.impactOccurred?.("light");
            openRegistration();
          }}
          className="powercxt-tap-target w-full min-h-[48px] rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-semibold leading-snug text-zinc-100 transition hover:bg-white/10 active:scale-[0.99] min-[400px]:px-6 min-[400px]:py-3.5 min-[400px]:text-sm"
        >
          Зарегистрироваться и получить бонус
        </button>
        <p className="text-center text-xs text-zinc-500">
          Если аккаунт уже есть — откроется вход на tkxn.org
        </p>
      </div>
    </div>
  );
}

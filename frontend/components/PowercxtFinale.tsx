"use client";

import { getPowercxtRegistrationUrl } from "@/lib/powercxt";
import { getTelegramWebApp } from "@/lib/telegram";

export function PowercxtFinale() {
  const url = getPowercxtRegistrationUrl();

  const openRegistration = () => {
    const twa = getTelegramWebApp();
    if (twa && typeof twa.openLink === "function") {
      twa.openLink(url);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex min-h-[70vh] w-full max-w-md flex-col justify-center gap-8 px-4 py-10 text-center">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-indigo-600">
          POWERCXT
        </p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight text-zinc-900">
          Доступ открыт
        </h1>
        <p className="mt-4 text-left text-sm leading-relaxed text-zinc-600">
          Создайте аккаунт на платформе и заберите приветственный бонус — например,{" "}
          <span className="font-medium text-zinc-800">500 токенов CXT</span>. Точные
          условия начисления указаны на сайте.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={openRegistration}
          className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-base font-semibold text-white shadow-md transition hover:opacity-95 active:scale-[0.99]"
        >
          Зарегистрироваться и получить бонус
        </button>
        <p className="text-xs text-zinc-500">
          Если аккаунт уже есть — откроется вход на tkxn.org
        </p>
      </div>
    </div>
  );
}

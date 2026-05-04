"use client";

import type { ReactNode } from "react";

/**
 * Мобильный каркас: на телефоне — на весь экран, на ПК — колонка ~430px по центру (как Telegram Mini App).
 */
export function MobileAppFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full justify-center bg-[#0c0e14] sm:items-center sm:py-3">
      <div
        className="flex h-[100dvh] w-full max-w-[430px] min-h-0 flex-col overflow-hidden shadow-none sm:h-[min(calc(100dvh-24px),852px)] sm:rounded-2xl sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.08)]"
        data-mobile-app-shell
      >
        {children}
      </div>
    </div>
  );
}

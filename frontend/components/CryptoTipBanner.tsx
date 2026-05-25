"use client";

import { useMemo } from "react";
import { tipForSession } from "@/lib/cryptoTips";

type Props = { seed?: number; className?: string };

export function CryptoTipBanner({ seed = 0, className = "" }: Props) {
  const text = useMemo(() => tipForSession(seed || Date.now()), [seed]);

  return (
    <div
      className={`mx-auto flex max-w-md items-start gap-2 rounded-sm border border-cyan-800/35 bg-[#120f0c]/40 px-2 py-1.5 ${className}`}
    >
      <span className="shrink-0 text-base leading-none" aria-hidden>
        💡
      </span>
      <p className="font-pixel text-[10px] leading-snug text-cyan-100/85 sm:text-[11px]">{text}</p>
    </div>
  );
}

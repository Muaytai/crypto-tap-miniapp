"use client";

import { TIER_META, type GoalTier } from "@/lib/goalTiers";

type Props = { tier: GoalTier; className?: string };

const TIER_DOT: Record<GoalTier, string> = {
  1: "bg-gradient-to-br from-stone-400 to-stone-600 shadow-[0_0_6px_rgba(168,162,158,0.5)]",
  2: "bg-gradient-to-br from-cyan-400 to-sky-600 shadow-[0_0_6px_rgba(34,211,238,0.45)]",
  3: "bg-gradient-to-br from-amber-300 to-amber-600 shadow-[0_0_6px_rgba(251,191,36,0.45)]",
  4: "bg-gradient-to-br from-violet-400 to-purple-600 shadow-[0_0_8px_rgba(167,139,250,0.5)]",
  5: "bg-gradient-to-br from-orange-400 to-amber-500 shadow-[0_0_10px_rgba(251,146,60,0.65)]",
};

export function GoalTierBadge({ tier, className = "" }: Props) {
  const meta = TIER_META[tier];
  return (
    <span
      className={`inline-flex w-fit max-w-full items-center gap-1.5 rounded-full border px-2 py-0.5 font-pixel text-[8px] uppercase tracking-wide ${meta.badge} ${className}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TIER_DOT[tier]}`} aria-hidden />
      {tier === 5 ? <span className="text-[9px] text-orange-300">₿</span> : null}
      <span>{meta.labelRu}</span>
    </span>
  );
}

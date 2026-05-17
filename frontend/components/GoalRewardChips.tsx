"use client";

import { CrystalDiamondIcon } from "@/components/CrystalDiamondIcon";

type Props = {
  rewardCoins: number;
  rewardCrystals: number;
  compact?: boolean;
};

export function GoalRewardChips({ rewardCoins, rewardCrystals, compact }: Props) {
  if (rewardCoins <= 0 && rewardCrystals <= 0) {
    return (
      <span className="font-pixel text-[9px] text-zinc-500">без награды</span>
    );
  }

  return (
    <div
      className={`flex shrink-0 flex-wrap justify-end gap-1 ${compact ? "max-w-[55%]" : ""}`}
      role="group"
      aria-label="Награды за цель"
    >
      {rewardCoins > 0 ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-gradient-to-r from-amber-950/80 to-amber-900/40 px-2 py-0.5 font-pixel text-[9px] text-amber-50 shadow-sm">
          <span className="text-[10px] leading-none text-amber-300" aria-hidden>
            ◎
          </span>
          +{rewardCoins.toLocaleString("ru-RU")}
        </span>
      ) : null}
      {rewardCrystals > 0 ? (
        <span className="inline-flex items-center gap-0.5 rounded-full border border-violet-400/40 bg-gradient-to-r from-violet-950/80 to-fuchsia-950/50 px-2 py-0.5 font-pixel text-[9px] text-violet-50 shadow-sm">
          <CrystalDiamondIcon size="xs" />
          +{rewardCrystals}
        </span>
      ) : null}
    </div>
  );
}

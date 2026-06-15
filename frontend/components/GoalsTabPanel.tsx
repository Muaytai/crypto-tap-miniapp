"use client";

import { AchievementsList } from "@/components/AchievementsList";
import { GoalsRoomBackground } from "@/components/GoalsRoomBackground";
import type { PlayerState } from "@/lib/api";

type Props = {
  initData: string;
  playerState: PlayerState;
  onReward?: (coins: number, crystals: number) => void;
  titleClassName?: string;
};

export function GoalsTabPanel({ initData, playerState, onReward }: Props) {
  return (
    <div className="relative flex w-full flex-col overflow-hidden bg-[#0a0806]">
      <GoalsRoomBackground />
      <div className="relative z-10 flex flex-col gap-3 px-4 pb-6 pt-4">
        <header className="text-center">
          <h1 className="font-pixel text-3xl font-bold tracking-[0.15em] text-cyan-400 drop-shadow-[0_0_15px_#22d3ee]">
            ЦЕЛИ
          </h1>
          <p className="mt-1 font-mono text-xs text-cyan-500/70">
            Путь к большим достижениям
          </p>
        </header>
        <AchievementsList initData={initData} playerState={playerState} onReward={onReward} />
      </div>
    </div>
  );
}

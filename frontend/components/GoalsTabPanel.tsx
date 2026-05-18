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

export function GoalsTabPanel({ initData, playerState, onReward, titleClassName }: Props) {
  return (
    <div className="relative flex w-full flex-col">
      <GoalsRoomBackground />
      <div className="relative z-10 flex flex-col gap-3 px-3 pb-3 pt-3">
        <header className="shrink-0 text-center">
          <h1
            className={
              titleClassName ??
              "font-pixel text-2xl text-[#f6cd2d] drop-shadow-[0_0_12px_rgba(246,205,45,0.35)]"
            }
          >
            Цели
          </h1>
          <p className="mt-1 font-pixel text-[10px] leading-relaxed text-cyan-200/70">
            Путь к 1 BTC — учись крипте шаг за шагом
          </p>
        </header>
        <AchievementsList initData={initData} playerState={playerState} onReward={onReward} />
      </div>
    </div>
  );
}

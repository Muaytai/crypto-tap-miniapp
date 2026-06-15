"use client";

import { PlayerState } from "@/lib/api";
import { playTapFeedback } from "@/lib/gameSounds";

type Props = {
  playerState: PlayerState;
  onTap: () => void;
  clickMultiplier: number;
  isAnimating: boolean;
};

const INCOME_LEVELS = [
  { threshold: 0, level: 1 },
  { threshold: 100, level: 2 },
  { threshold: 1000, level: 3 },
  { threshold: 10000, level: 4 },
  { threshold: 100000, level: 5 },
  { threshold: 1000000, level: 6 },
  { threshold: 10000000, level: 7 },
  { threshold: 100000000, level: 8 },
  { threshold: 1000000000, level: 9 },
  { threshold: 10000000000, level: 10 },
];

function getLevelByIncome(income: number): number {
  for (let i = INCOME_LEVELS.length - 1; i >= 0; i--) {
    if (income >= INCOME_LEVELS[i].threshold) return INCOME_LEVELS[i].level;
  }
  return 1;
}

export function RoomScene({ playerState, onTap, clickMultiplier, isAnimating }: Props) {
  const incomeLevel = getLevelByIncome(playerState.income_per_second);

  return (
    <div className="relative h-full w-full overflow-hidden select-none">
       {/* КНОПКА ТАПА (z-10) */}
      <div className="absolute left-1/2 bottom-6 -translate-x-1/2 z-10">
        <button
          onClick={() => {
            playTapFeedback();
            onTap();
          }}
          className={`tap-target relative flex h-32 w-32 items-center justify-center transition-transform active:scale-95 ${
            isAnimating ? "scale-105" : ""
          }`}
        >
          <img
            src={`/images/buttons/button_${incomeLevel}.png`}
            alt="Tap"
            className="h-full w-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/buttons/button_1.png";
            }}
          />
          {isAnimating && (
            <span className="font-mono animate-ripple pointer-events-none absolute text-xl font-bold text-white/90">
              +{clickMultiplier}
            </span>
          )}
        </button>
      </div>

    </div>
  );
}
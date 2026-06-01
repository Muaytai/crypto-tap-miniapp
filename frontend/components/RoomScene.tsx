"use client";

import { PlayerState } from "@/lib/api";

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

  const getItemLevel = (itemId: number) => {
    return playerState.items.find(i => i.item_id === itemId)?.level || 1;
  };

  const sofaLevel = getItemLevel(1);
  const deskLevel = getItemLevel(2);
  const laptopLevel = getItemLevel(3);
  const chairLevel = getItemLevel(4);

  return (
    <div className="relative h-full w-full overflow-hidden select-none">

      {/* ДИВАН */}
      <div className="absolute left-[-45%] bottom-[6%] w-[100%] max-w-[560px] z-[1]">
        <img
          src={`/images/sofa/sofa_${sofaLevel}.png`}
          alt="Диван"
          className="w-full h-auto object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/images/sofa/sofa_1.png";
          }}
        />
      </div>

      {/* СТОЛ */}
      <div className="absolute right-[-5%] bottom-[15%] w-[100%] max-w-[320px] z-[2]">
        <img
          src={`/images/desk/desk_${deskLevel}.png`}
          alt="Стол"
          className="w-full h-auto object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/images/desk/desk_1.png";
          }}
        />
      </div>

      {/* ПК */}
      <div className="absolute right-[5%] bottom-[29%] w-[35%] max-w-[180px] z-[3]">
        <img
          src={`/images/laptop/laptop_${laptopLevel}.png`}
          alt="Ноутбук"
          className="w-full h-auto object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/images/laptop/laptop_1.png";
          }}
        />
      </div>

      {/* СТУЛ */}
      <div className="absolute right-[12%] bottom-[10%] w-[60%] max-w-[160px] z-[4]">
        <img
          src={`/images/chair/chair_${chairLevel}.png`}
          alt="Стул"
          className="w-full h-auto object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/images/chair/chair_1.png";
          }}
        />
      </div>

      {/* ПЕРСОНАЖ */}
      <div className="absolute left-[18%] bottom-[14%] w-[40%] max-w-[200px] z-[5]">
        <img
          src={`/images/character/char_${incomeLevel}.png`}
          alt="Персонаж"
          className="w-full h-auto object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/images/character/char_1.png";
          }}
        />
      </div>

      {/* HUD — без изменений */}
      <div className="absolute top-5 left-0 right-0 z-20 pointer-events-none">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-3xl leading-none text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.75)]">
              ◆
            </span>
            <p className="font-mono text-5xl font-bold leading-none tracking-tight text-cyan-100 drop-shadow-[0_0_14px_rgba(34,211,238,0.45)]">
              {Math.floor(playerState.player.coins).toLocaleString("ru-RU")}
            </p>
          </div>
          <p className="font-mono mt-2 text-base text-cyan-400/95">
            +{playerState.income_per_second} хеш/сек
          </p>
          <p className="font-mono mt-1 text-[11px] uppercase tracking-wide text-white/40">
            токены
          </p>
        </div>
      </div>

      {/* КНОПКА ТАПА */}
      <div className="absolute left-1/2 bottom-2 -translate-x-1/2 z-10">
        <button
          onClick={onTap}
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
"use client";

import { useEffect, useState } from "react";
import type { PlayerState } from "@/lib/api";

type Props = {
  incomePerSecond: number;
  children?: React.ReactNode;
  isDev?: boolean;
  onIncomeChange?: (newIncome: number) => void;
  onComponentUpgrade?: (itemId: number, delta: number) => void;
  playerState?: PlayerState | null;
};

const BACKGROUND_LEVELS = [
  { threshold: 0, level: 1, name: "background_1" },
  { threshold: 100, level: 2, name: "background_2" },
  { threshold: 1000, level: 3, name: "background_3" },
  { threshold: 10000, level: 4, name: "background_4" },
  { threshold: 100000, level: 5, name: "background_5" },
  { threshold: 1000000, level: 6, name: "background_6" },
  { threshold: 10000000, level: 7, name: "background_7" },
  { threshold: 100000000, level: 8, name: "background_8" },
  { threshold: 1000000000, level: 9, name: "background_9" },
  { threshold: 10000000000, level: 10, name: "background_10" },
];

const COMPONENTS = [
  { id: 1, name: "Диван", icon: "🛋️" },
  { id: 2, name: "Стол", icon: "🪵" },
  { id: 3, name: "Ноутбук", icon: "💻" },
  { id: 4, name: "Стул", icon: "🪑" },
];

export function DynamicBackground({
  incomePerSecond,
  children,
  isDev = false,
  onIncomeChange,
  onComponentUpgrade,
  playerState
}: Props) {
  const [backgroundLevel, setBackgroundLevel] = useState(1);
  const [backgroundImage, setBackgroundImage] = useState("/images/backgrounds/background_1.png");
  const [imgError, setImgError] = useState(false);
  const [testIncome, setTestIncome] = useState(incomePerSecond);
  const [panelVisible, setPanelVisible] = useState(true);
  const [showComponentPanel, setShowComponentPanel] = useState(false);

  // Сохраняем состояние панели
  useEffect(() => {
    if (!isDev) return;
    const saved = localStorage.getItem("dev_panel_visible");
    if (saved !== null) setPanelVisible(saved === "true");
  }, [isDev]);

  const togglePanel = () => {
    const newState = !panelVisible;
    setPanelVisible(newState);
    localStorage.setItem("dev_panel_visible", String(newState));
  };

  // Применяем тестовый доход к глобальному состоянию
  const applyTestIncome = (value: number) => {
    setTestIncome(value);
    if (onIncomeChange) {
      onIncomeChange(value);
    }
  };

  useEffect(() => {
    let currentLevel = 1;
    for (let i = BACKGROUND_LEVELS.length - 1; i >= 0; i--) {
      if (incomePerSecond >= BACKGROUND_LEVELS[i].threshold) {
        currentLevel = BACKGROUND_LEVELS[i].level;
        break;
      }
    }
    setBackgroundLevel(currentLevel);
    setBackgroundImage(`/images/backgrounds/background_${currentLevel}.png`);
    setImgError(false);
  }, [incomePerSecond]);

  const formatNumber = (num: number): string => {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return num.toString();
  };

  const getComponentLevel = (itemId: number): number => {
    return playerState?.items.find(i => i.item_id === itemId)?.level || 1;
  };

  return (
    <div
      className="relative h-full w-full bg-cover bg-center bg-no-repeat transition-all duration-500"
      style={{
        backgroundImage: imgError ? "none" : `url(${backgroundImage})`,
        backgroundColor: imgError ? "#0a0a0a" : undefined,
      }}
    >
      {/* DEV-контроллер */}
      {isDev && (
        <>
          {/* Основная панель дохода */}
          <div
            className={`fixed bottom-20 left-2 z-50 rounded-xl bg-black/90 backdrop-blur-md transition-all duration-300 ${
              panelVisible ? "p-3" : "p-2"
            }`}
            style={{ width: panelVisible ? "260px" : "auto" }}
          >
            <button
              onClick={togglePanel}
              className="absolute -top-3 -right-3 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-600 text-xs font-bold text-white hover:bg-cyan-500"
            >
              {panelVisible ? "−" : "+"}
            </button>

            {panelVisible ? (
              <>
                <p className="font-pixel text-[10px] text-cyan-400 mb-2">DEV: ТЕСТ ДОХОДА</p>
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-[9px] text-white/60 w-12">0</span>
                  <input
                    type="range"
                    min="0"
                    max="10000000000"
                    step="100"
                    value={testIncome}
                    onChange={(e) => applyTestIncome(Number(e.target.value))}
                    className="h-2 rounded-lg appearance-none bg-zinc-700 flex-1"
                    style={{ width: "140px" }}
                  />
                  <span className="font-pixel text-[9px] text-white/60 w-12 text-right">10B</span>
                </div>
                <div className="mt-2 text-center">
                  <span className="font-pixel text-[11px] text-cyan-400">
                    {formatNumber(testIncome)} / сек
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1 justify-center">
                  {BACKGROUND_LEVELS.map((level) => (
                    <button
                      key={level.level}
                      onClick={() => applyTestIncome(level.threshold + (level.level === 1 ? 1 : 0))}
                      className={`rounded px-2 py-0.5 font-pixel text-[9px] transition ${
                        backgroundLevel === level.level
                          ? "bg-cyan-600 text-white"
                          : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                      }`}
                    >
                      {level.level}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-center font-pixel text-[8px] text-zinc-500">
                  Фон: {backgroundLevel}/10
                </p>

                {/* Кнопка переключения на панель компонентов */}
                <button
                  onClick={() => setShowComponentPanel(!showComponentPanel)}
                  className="mt-3 w-full rounded bg-purple-600/50 px-2 py-1 font-pixel text-[9px] text-white hover:bg-purple-600"
                >
                  {showComponentPanel ? "▲ Скрыть компоненты" : "▼ Тест компонентов"}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1">
                <span className="font-pixel text-[10px] text-cyan-400">🎨</span>
                <span className="font-pixel text-[10px] text-white">Фон {backgroundLevel}/10</span>
                <span className="font-pixel text-[9px] text-zinc-500 ml-1">
                  ({formatNumber(incomePerSecond)}/с)
                </span>
              </div>
            )}
          </div>

          {/* Панель прокачки компонентов */}
          {showComponentPanel && (
            <div className="fixed bottom-20 left-[270px] z-50 rounded-xl bg-black/90 backdrop-blur-md p-3 w-56">
              <p className="font-pixel text-[10px] text-purple-400 mb-2 text-center">
                ТЕСТ КОМНАТЫ (визуал)
              </p>
              {COMPONENTS.map((comp) => {
                const currentLevel = getComponentLevel(comp.id);
                return (
                  <div key={comp.id} className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <span className="text-sm">{comp.icon}</span>
                      <span className="font-pixel text-[9px] text-white">{comp.name}</span>
                      <span className="font-pixel text-[8px] text-purple-400 ml-1">
                        Ур.{currentLevel}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onComponentUpgrade?.(comp.id, -1)}
                        disabled={currentLevel <= 1}
                        className={`px-2 py-0.5 rounded text-[10px] font-pixel text-white ${
                          currentLevel <= 1
                            ? "bg-zinc-700 cursor-not-allowed opacity-50"
                            : "bg-red-600 hover:bg-red-500"
                        }`}
                      >
                        −1 ур.
                      </button>
                      <button
                        onClick={() => onComponentUpgrade?.(comp.id, 1)}
                        disabled={currentLevel >= 10}
                        className={`px-2 py-0.5 rounded text-[10px] font-pixel text-white ${
                          currentLevel >= 10
                            ? "bg-zinc-700 cursor-not-allowed opacity-50"
                            : "bg-green-600 hover:bg-green-500"
                        }`}
                      >
                        +1 ур.
                      </button>
                    </div>
                  </div>
                );
              })}
              <p className="text-center font-pixel text-[7px] text-zinc-500 mt-2">
                Меняет только визуал (уровень), не влияет на покупки
              </p>
            </div>
          )}
        </>
      )}

      {children}

      <img
        src={backgroundImage}
        alt=""
        className="hidden"
        onError={() => setImgError(true)}
        onLoad={() => setImgError(false)}
      />
    </div>
  );
}
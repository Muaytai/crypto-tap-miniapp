"use client";

import { useEffect, useState } from "react";

type Props = {
  incomePerSecond: number;
  children?: React.ReactNode;
  isDev?: boolean;
};

// Пороги для смены фона
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

export function DynamicBackground({ incomePerSecond, children, isDev = false }: Props) {
  const [backgroundLevel, setBackgroundLevel] = useState(1);
  const [backgroundImage, setBackgroundImage] = useState("/images/backgrounds/background_1.png");
  const [imgError, setImgError] = useState(false);
  const [testIncome, setTestIncome] = useState(incomePerSecond);
  const [panelVisible, setPanelVisible] = useState(true);

  // Сохраняем состояние панели в localStorage
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

  const effectiveIncome = isDev && testIncome !== undefined ? testIncome : incomePerSecond;

  useEffect(() => {
    let currentLevel = 1;
    for (let i = BACKGROUND_LEVELS.length - 1; i >= 0; i--) {
      if (effectiveIncome >= BACKGROUND_LEVELS[i].threshold) {
        currentLevel = BACKGROUND_LEVELS[i].level;
        break;
      }
    }
    setBackgroundLevel(currentLevel);
    setBackgroundImage(`/images/backgrounds/background_${currentLevel}.png`);
    setImgError(false);
  }, [effectiveIncome]);

  return (
    <div
      className="relative h-full w-full bg-cover bg-center bg-no-repeat transition-all duration-500"
      style={{
        backgroundImage: imgError ? "none" : `url(${backgroundImage})`,
        backgroundColor: imgError ? "#1a1410" : undefined,
      }}
    >
      {/* DEV-контроллер */}
      {isDev && (
        <div
          className={`fixed bottom-20 left-2 z-50 rounded-xl bg-black/90 backdrop-blur-md transition-all duration-300 ${
            panelVisible ? "p-3" : "p-2"
          }`}
        >
          {/* Кнопка свернуть/развернуть */}
          <button
            onClick={togglePanel}
            className="absolute -top-3 -right-3 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-600 text-xs font-bold text-white hover:bg-cyan-500"
          >
            {panelVisible ? "−" : "+"}
          </button>

          {panelVisible ? (
            <>
              <p className="font-pixel text-[10px] text-cyan-400">ТЕСТ ФОНОВ</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-pixel text-xs text-white">
                  Доход: {effectiveIncome.toLocaleString("ru-RU")}/сек
                </span>
                <input
                  type="range"
                  min="0"
                  max="10000000000"
                  step="100"
                  value={testIncome}
                  onChange={(e) => setTestIncome(Number(e.target.value))}
                  className="h-2 w-40 appearance-none rounded-lg bg-zinc-700"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {BACKGROUND_LEVELS.map((level) => (
                  <button
                    key={level.level}
                    onClick={() => setTestIncome(level.threshold + (level.level === 1 ? 1 : 0))}
                    className={`rounded px-2 py-0.5 font-pixel text-[9px] ${
                      backgroundLevel === level.level
                        ? "bg-cyan-600 text-white"
                        : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                    }`}
                  >
                    {level.level}
                  </button>
                ))}
              </div>
              <p className="mt-2 font-pixel text-[8px] text-zinc-500">
                Текущий фон: {backgroundLevel}/10
              </p>
            </>
          ) : (
            <div className="flex items-center gap-1">
              <span className="font-pixel text-[10px] text-cyan-400">🎨</span>
              <span className="font-pixel text-[10px] text-white">Фон {backgroundLevel}/10</span>
            </div>
          )}
        </div>
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
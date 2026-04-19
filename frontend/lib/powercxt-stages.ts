export const POWERCXT_STORAGE_KEY = "powercxt_stage_v3";

export type StageMeta = {
  id: number;
  title: string;
  tagline: string;
};

export const POWERCXT_STAGES: StageMeta[] = [
  {
    id: 1,
    title: "Старт ядра",
    tagline: "Пробудите реактор первыми импульсами — быстрые нажатия заряжают контур.",
  },
  {
    id: 2,
    title: "Импульсный спринт",
    tagline: "Окно ускорения ограничено по времени. Уложитесь в лимит тапов.",
  },
  {
    id: 3,
    title: "Захват канала",
    tagline: "Удерживайте линию связи стабильно — без рывков и срывов.",
  },
  {
    id: 4,
    title: "Точка синхронизации",
    tagline: "Поймайте момент, когда индикатор входит в зелёную зону.",
  },
  {
    id: 5,
    title: "Накопитель мощности",
    tagline: "Заполните конденсатор: иногда выпадает усиленный импульс.",
  },
  {
    id: 6,
    title: "Вектор разряда",
    tagline: "Снимите заряд свайпом вверх — направьте поток энергии.",
  },
  {
    id: 7,
    title: "Двойной импульс",
    tagline: "Синхронизируйте парные срабатывания — как подтверждение в сети.",
  },
  {
    id: 8,
    title: "Выход на мощность",
    tagline: "Финальная серия — доведите систему до готовности.",
  },
];

export function loadStageIndex(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(POWERCXT_STORAGE_KEY);
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    if (Number.isNaN(n) || n < 0) return 0;
    if (n > POWERCXT_STAGES.length) return POWERCXT_STAGES.length;
    return n;
  } catch {
    return 0;
  }
}

export function saveStageIndex(index: number): void {
  try {
    localStorage.setItem(POWERCXT_STORAGE_KEY, String(index));
  } catch {
    /* ignore */
  }
}

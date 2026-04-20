export const POWERCXT_STORAGE_KEY = "powercxt_stage_v3";

export type StageMeta = {
  id: number;
  title: string;
  tagline: string;
};

export const POWERCXT_STAGES: StageMeta[] = [
  {
    id: 1,
    title: "Разгон",
    tagline: "Нажимайте быстро — первые тапы задают темп.",
  },
  {
    id: 2,
    title: "Спринт",
    tagline: "Уложитесь в лимит времени и набейте нужное число тапов.",
  },
  {
    id: 3,
    title: "Удержание",
    tagline: "Держите линию ровно, без рывков.",
  },
  {
    id: 4,
    title: "В ноль",
    tagline: "Попадайте в зелёную зону, когда индикатор совпадёт.",
  },
  {
    id: 5,
    title: "Накопление",
    tagline: "Заполняйте шкалу; иногда засчитывается двойной тап.",
  },
  {
    id: 6,
    title: "Свайп",
    tagline: "Проведите вверх нужное число раз.",
  },
  {
    id: 7,
    title: "Двойной тап",
    tagline: "Ловите пары нажатий в коротком окне.",
  },
  {
    id: 8,
    title: "Финиш",
    tagline: "Последняя серия — доведите этап до конца.",
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

export function resetStageProgress(): void {
  try {
    localStorage.removeItem(POWERCXT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

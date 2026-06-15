/** Пять новых улучшений (id 11–15) — дополнение к базовым десяти в dev-моке. */
export type DevUpgradeEntry = {
  id: number;
  name: string;
  description: string;
  upgrade_type: "click_multiplier" | "income_multiplier" | "offline_extension";
  value: number;
  base_price: number;
  min_total_taps: number;
  icon_name: string;
};

export const NEW_UPGRADES_FOR_DEV: DevUpgradeEntry[] = [
  {
    id: 11,
    name: "Мощная ферма",
    description: "Риг работает на полную — пассивный доход от лаборатории +30%.",
    upgrade_type: "income_multiplier",
    value: 1.3,
    base_price: 750_000,
    min_total_taps: 75_000,
    icon_name: "power_farm",
  },
  {
    id: 12,
    name: "Сильный тап",
    description: "Каждый клик приносит на 75% больше осколков.",
    upgrade_type: "click_multiplier",
    value: 1.75,
    base_price: 1_200_000,
    min_total_taps: 150_000,
    icon_name: "strong_tap",
  },
  {
    id: 13,
    name: "Ночной запас",
    description: "Риг копит монеты ещё 3 часа, пока вы не в игре.",
    upgrade_type: "offline_extension",
    value: 180,
    base_price: 900_000,
    min_total_taps: 40_000,
    icon_name: "night_reserve",
  },
  {
    id: 14,
    name: "Связка ригов",
    description: "Нужен ноутбук: риги работают вместе — общий доход ×1.75.",
    upgrade_type: "income_multiplier",
    value: 1.75,
    base_price: 1_500_000,
    min_total_taps: 100_000,
    icon_name: "rig_link",
  },
  {
    id: 15,
    name: "Большой сейф",
    description: "Монеты дольше копятся offline — ещё +4 часа к лимиту.",
    upgrade_type: "offline_extension",
    value: 240,
    base_price: 2_500_000,
    min_total_taps: 200_000,
    icon_name: "big_vault",
  },
];

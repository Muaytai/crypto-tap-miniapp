import type { PlayerState } from "@/lib/api";

export function computeIncomeMultiplier(state: PlayerState): number {
  const purchased = new Set(state.upgrades.map((u) => u.upgrade_id));
  return state.available_upgrades
    .filter((u) => u.upgrade_type === "income_multiplier" && purchased.has(u.id))
    .reduce((acc, u) => acc * u.value, 1);
}

/** Пассивный доход: Σ(quantity × base_income) × множители улучшений. */
export function computeIncomePerSecond(state: PlayerState): number {
  const mult = computeIncomeMultiplier(state);
  let base = 0;

  for (const owned of state.items) {
    const catalog = state.available_items.find((i) => i.id === owned.item_id);
    const rate = catalog?.base_income_per_second ?? owned.item_base_income ?? 0;
    base += owned.quantity * rate;
  }

  return Math.floor(base * mult);
}

export function getItemIncomeRate(
  item: PlayerState["available_items"][0],
  quantity: number,
): number {
  return item.base_income_per_second * quantity;
}

/** Уровень компонента по накопленному количеству (10 → ур.2, +20 → ур.3 …). */
export function computeItemLevelFromQuantity(quantity: number): number {
  let level = 1;
  let spent = 0;
  while (level < 10) {
    const needed = level * 10;
    if (quantity < spent + needed) return level;
    spent += needed;
    level++;
  }
  return 10;
}

export function withRecalculatedIncome(state: PlayerState): PlayerState {
  return { ...state, income_per_second: computeIncomePerSecond(state) };
}

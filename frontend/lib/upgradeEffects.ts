import type { PlayerState } from "@/lib/api";
import { withRecalculatedIncome } from "@/lib/income";

export type UpgradeRow = PlayerState["available_upgrades"][0];

/** Итоговый множитель клика — перемножение всех купленных click_multiplier. */
export function computeClickMultiplier(state: PlayerState): number {
  const purchasedIds = new Set(state.upgrades.map((u) => u.upgrade_id));
  return state.available_upgrades
    .filter((u) => u.upgrade_type === "click_multiplier" && purchasedIds.has(u.id))
    .reduce((acc, u) => acc * u.value, 1);
}

export function getUpgradeEffectBadge(upgrade: UpgradeRow): { label: string; className: string } {
  switch (upgrade.upgrade_type) {
    case "click_multiplier":
      return {
        label: `ТАП ×${upgrade.value}`,
        className: "border-cyan-500/40 bg-cyan-950/50 text-cyan-300",
      };
    case "income_multiplier": {
      const pct = Math.round((upgrade.value - 1) * 100);
      return {
        label: pct > 0 ? `ДОХОД +${pct}%` : `ДОХОД ×${upgrade.value}`,
        className: "border-emerald-500/40 bg-emerald-950/50 text-emerald-300",
      };
    }
    case "offline_extension": {
      const mins = upgrade.value;
      const label = mins >= 60 ? `ОФФЛАЙН +${mins / 60}ч` : `ОФФЛАЙН +${mins}м`;
      return {
        label,
        className: "border-violet-500/40 bg-violet-950/50 text-violet-300",
      };
    }
    default:
      return {
        label: "БОНУС",
        className: "border-zinc-500/40 bg-zinc-950/50 text-zinc-300",
      };
  }
}

/** Доступные сверху, купленные снизу. */
export function sortUpgrades(upgrades: UpgradeRow[], purchasedIds: Set<number>): UpgradeRow[] {
  return [...upgrades].sort((a, b) => {
    const aDone = purchasedIds.has(a.id);
    const bDone = purchasedIds.has(b.id);
    if (aDone !== bDone) return aDone ? 1 : -1;
    return a.id - b.id;
  });
}

export function getUnlockProgress(
  upgrade: UpgradeRow,
  totalTaps: number,
): { current: number; target: number; pct: number } | null {
  if (upgrade.min_total_taps <= 0 || totalTaps >= upgrade.min_total_taps) return null;
  const current = totalTaps;
  const target = upgrade.min_total_taps;
  return {
    current,
    target,
    pct: Math.min(100, (current / target) * 100),
  };
}

/** Локальная симуляция покупки в dev-режиме. */
export function applyDevUpgradePurchase(state: PlayerState, upgrade: UpgradeRow): PlayerState {
  const next: PlayerState = {
    ...state,
    player: {
      ...state.player,
      coins: state.player.coins - upgrade.base_price,
      max_offline_minutes:
        upgrade.upgrade_type === "offline_extension"
          ? state.player.max_offline_minutes + Math.floor(upgrade.value)
          : state.player.max_offline_minutes,
    },
    upgrades: [
      ...state.upgrades,
      {
        upgrade_id: upgrade.id,
        upgrade_name: upgrade.name,
        upgrade_icon: upgrade.icon_name || "",
      },
    ],
  };
  return withRecalculatedIncome(next);
}

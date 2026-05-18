/** Ранг цели 1–5: common → legendary */

export type GoalTier = 1 | 2 | 3 | 4 | 5;

export type GoalForTier = {
  name: string;
  trigger_type: string;
  trigger_value: number;
  reward_crystals: number;
  reward_coins: number;
};

/** Флагманские цели — всегда legendary, даже при низком пороге (если добавите такие). */
export const MANUAL_LEGENDARY_NAMES = new Set<string>([
  "Легенда сети",
  "Абсолютный кликер",
  "Триллионный масштаб",
  "Безупречный парк",
  "Империя оборота",
  "Фабрика хешей",
  "Архитектор стратегии",
]);

export const TIER_META: Record<
  GoalTier,
  { label: string; labelRu: string; badge: string; borderAccent: string }
> = {
  1: {
    label: "Common",
    labelRu: "Базовая",
    badge:
      "border-zinc-400/50 bg-gradient-to-r from-zinc-600/35 via-stone-800/85 to-zinc-950/90 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
    borderAccent: "border-l-zinc-400/60",
  },
  2: {
    label: "Uncommon",
    labelRu: "Рост",
    badge: "border-cyan-500/35 bg-gradient-to-r from-cyan-950/70 to-sky-950/80 text-cyan-100",
    borderAccent: "border-l-cyan-500/55",
  },
  3: {
    label: "Rare",
    labelRu: "Редкая",
    badge: "border-amber-500/40 bg-gradient-to-r from-amber-950/60 to-orange-950/50 text-amber-100",
    borderAccent: "border-l-amber-500/55",
  },
  4: {
    label: "Epic",
    labelRu: "Эпик",
    badge: "border-violet-400/45 bg-gradient-to-r from-violet-950/70 to-fuchsia-950/60 text-violet-100",
    borderAccent: "border-l-violet-400/60",
  },
  5: {
    label: "Legend",
    labelRu: "Легенда",
    badge: "border-orange-400/50 bg-gradient-to-r from-orange-950/70 to-amber-950/50 text-orange-100",
    borderAccent: "border-l-orange-400/70",
  },
};

function tierFromThreshold(triggerType: string, value: number, crystals: number): GoalTier {
  let valueTier: GoalTier = 1;

  switch (triggerType) {
    case "total_taps":
      if (value >= 50_000_000) valueTier = 5;
      else if (value >= 5_000_000) valueTier = 4;
      else if (value >= 500_000) valueTier = 3;
      else if (value >= 10_000) valueTier = 2;
      break;
    case "total_coins_earned":
      if (value >= 100_000_000_000) valueTier = 5;
      else if (value >= 1_000_000_000) valueTier = 4;
      else if (value >= 10_000_000) valueTier = 3;
      else if (value >= 100_000) valueTier = 2;
      break;
    case "items_bought":
      if (value >= 2_000) valueTier = 5;
      else if (value >= 600) valueTier = 4;
      else if (value >= 100) valueTier = 3;
      else if (value >= 30) valueTier = 2;
      break;
    case "prestige_count":
      if (value >= 20) valueTier = 5;
      else if (value >= 10) valueTier = 4;
      else if (value >= 3) valueTier = 3;
      else if (value >= 1) valueTier = 2;
      break;
    default:
      break;
  }

  let crystalTier: GoalTier = 1;
  if (crystals >= 80) crystalTier = 5;
  else if (crystals >= 25) crystalTier = 4;
  else if (crystals >= 8) crystalTier = 3;
  else if (crystals >= 2) crystalTier = 2;

  return Math.max(valueTier, crystalTier) as GoalTier;
}

export function getGoalTier(ach: GoalForTier): GoalTier {
  if (MANUAL_LEGENDARY_NAMES.has(ach.name)) {
    return 5;
  }
  return tierFromThreshold(ach.trigger_type, ach.trigger_value, ach.reward_crystals);
}

export function tierCardClass(tier: GoalTier, isEarned: boolean): string {
  const accent = TIER_META[tier].borderAccent;
  const base = `relative overflow-hidden rounded-xl border border-white/10 border-l-[3px] ${accent} bg-[#121922]/90 backdrop-blur-sm transition-all `;
  if (isEarned) {
    return `${base} !border-l-[#f6cd2d]/90 border-[#f6cd2d]/50 bg-[#1a1b14]/95 p-3 shadow-[0_0_20px_rgba(246,205,45,0.12)]`;
  }
  switch (tier) {
    case 1:
      return `${base} bg-[#131820]/95 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`;
    case 2:
      return `${base} p-3`;
    case 3:
      return `${base} p-3 shadow-[0_0_14px_rgba(245,158,11,0.06)]`;
    case 4:
      return `${base} p-3.5 shadow-[0_0_20px_rgba(139,92,246,0.1)]`;
    case 5:
      return `${base} p-3.5 shadow-[0_0_24px_rgba(251,146,60,0.14)] ${!isEarned ? "animate-ach-gold-ring" : ""}`;
    default:
      return `${base} p-3`;
  }
}

export function tierTitleClass(tier: GoalTier): string {
  switch (tier) {
    case 1:
      return "font-pixel text-[14px] leading-tight text-zinc-300";
    case 2:
      return "font-pixel text-[15px] leading-tight text-slate-100";
    case 3:
      return "font-pixel text-[15px] leading-tight text-amber-50";
    case 4:
      return "font-pixel text-[16px] leading-tight text-violet-50";
    case 5:
      return "font-pixel text-[17px] leading-tight text-orange-50 drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]";
    default:
      return "font-pixel text-[16px] text-[#eef2f6]";
  }
}

export function tierIconSizeClass(tier: GoalTier): string {
  switch (tier) {
    case 1:
      return "h-10 w-10";
    case 2:
      return "h-11 w-11";
    case 3:
      return "h-12 w-12";
    case 4:
      return "h-[3.25rem] w-[3.25rem]";
    case 5:
      return "h-14 w-14";
    default:
      return "h-12 w-12";
  }
}

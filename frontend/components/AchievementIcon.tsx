"use client";

import { tierIconSizeClass, type GoalTier } from "@/lib/goalTiers";

type AchievementLike = {
  name: string;
  description: string;
  trigger_type: string;
  is_earned: boolean;
  icon_name?: string;
};

export type AchievementIconKind =
  | "tap"
  | "satoshi"
  | "chart"
  | "gpu"
  | "rig"
  | "asic"
  | "datacenter"
  | "wallet"
  | "hodl"
  | "shield"
  | "diamond"
  | "rocket"
  | "default";

const ICON_NAMES: AchievementIconKind[] = [
  "tap",
  "satoshi",
  "chart",
  "gpu",
  "rig",
  "asic",
  "datacenter",
  "wallet",
  "hodl",
  "shield",
  "diamond",
  "rocket",
  "default",
];

/** Крупный символ в едином «чипе» — читается лучше, чем мелкий SVG */
const GLYPH: Record<AchievementIconKind, string> = {
  tap: "⚡",
  satoshi: "₿",
  chart: "📈",
  gpu: "🎮",
  rig: "🖥️",
  asic: "⛏️",
  datacenter: "🏭",
  wallet: "💼",
  hodl: "🔒",
  shield: "🛡️",
  diamond: "💎",
  rocket: "🚀",
  default: "🎯",
};

const GLYPH_BG: Record<AchievementIconKind, string> = {
  tap: "from-cyan-500/30 to-blue-600/20",
  satoshi: "from-amber-400/30 to-yellow-600/20",
  chart: "from-emerald-500/25 to-cyan-600/20",
  gpu: "from-slate-500/30 to-slate-700/20",
  rig: "from-sky-500/25 to-indigo-700/20",
  asic: "from-violet-500/25 to-purple-800/20",
  datacenter: "from-cyan-600/20 to-blue-900/25",
  wallet: "from-sky-400/25 to-blue-700/20",
  hodl: "from-amber-500/20 to-stone-700/25",
  shield: "from-emerald-500/20 to-teal-800/25",
  diamond: "from-violet-400/30 to-fuchsia-700/20",
  rocket: "from-orange-500/25 to-red-700/20",
  default: "from-zinc-500/20 to-zinc-800/30",
};

export function achievementIconKind(ach: AchievementLike): AchievementIconKind {
  const key = ach.icon_name?.trim().toLowerCase();
  if (key && ICON_NAMES.includes(key as AchievementIconKind)) {
    return key as AchievementIconKind;
  }
  if (ach.trigger_type === "total_taps") return "tap";
  if (ach.trigger_type === "total_coins_earned") return "satoshi";
  if (ach.trigger_type === "items_bought") return "gpu";
  if (ach.trigger_type === "prestige_count") return "hodl";
  return "default";
}

type Props = {
  achievement: AchievementLike;
  progressPct: number;
  tier?: GoalTier;
};

export function AchievementIcon({ achievement, progressPct, tier = 3 }: Props) {
  const kind = achievementIconKind(achievement);
  const earned = achievement.is_earned;
  const inProgress = !earned && progressPct > 0 && progressPct < 100;
  const sizeClass = tierIconSizeClass(tier);
  const glyph = GLYPH[kind];
  const glyphSize =
    tier >= 5 ? "text-2xl" : tier >= 4 ? "text-xl" : tier >= 3 ? "text-lg" : "text-base";

  return (
    <div
      className={[
        "relative flex shrink-0 items-center justify-center rounded-2xl border shadow-inner",
        sizeClass,
        `bg-gradient-to-br ${GLYPH_BG[kind]}`,
        earned
          ? "border-emerald-400/60 from-emerald-950 to-cyan-950 shadow-[0_0_18px_rgba(16,185,129,0.3)]"
          : inProgress
            ? "border-cyan-400/50 shadow-[0_0_14px_rgba(34,211,238,0.25)]"
            : "border-white/15",
      ].join(" ")}
      aria-hidden
    >
      <span className="select-none text-3xl leading-none">{glyph}</span>
      {earned && (
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-emerald-400 bg-black text-xs text-emerald-400">
          ✓
        </span>
      )}
    </div>
  );
}

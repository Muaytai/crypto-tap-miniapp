"use client";

import { useState } from "react";
import { achievementImageUrl } from "@/lib/achievementIcons";
import { tierIconSizeClass, type GoalTier } from "@/lib/goalTiers";

type AchievementLike = {
  id?: number;
  name: string;
  description: string;
  trigger_type: string;
  is_earned: boolean;
  icon_name?: string;
};

type AchievementIconKind =
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

function achievementIconKind(ach: AchievementLike): AchievementIconKind {
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
  sortIndex?: number;
};

export function AchievementIcon({ achievement, progressPct, tier = 3, sortIndex = 0 }: Props) {
  const [imgError, setImgError] = useState(false);
  const kind = achievementIconKind(achievement);
  const earned = achievement.is_earned;
  const inProgress = !earned && progressPct > 0 && progressPct < 100;
  const sizeClass = tierIconSizeClass(tier);
  const glyph = GLYPH[kind];
  const imageUrl = achievementImageUrl(achievement, sortIndex);

  return (
    <div
      className={[
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border shadow-inner",
        sizeClass,
        earned
          ? "border-emerald-400/60 bg-zinc-950 shadow-[0_0_18px_rgba(16,185,129,0.3)]"
          : inProgress
            ? "border-cyan-400/50 bg-zinc-950 shadow-[0_0_14px_rgba(34,211,238,0.25)]"
            : "border-white/15 bg-zinc-950/90",
      ].join(" ")}
      aria-hidden
    >
      {!imgError ? (
        <img
          src={imageUrl}
          alt=""
          className={[
            "h-full w-full object-contain p-1 transition-all",
            earned ? "drop-shadow-[0_0_10px_rgba(16,185,129,0.35)]" : inProgress ? "opacity-90" : "opacity-75 grayscale-[0.35]",
          ].join(" ")}
          onError={() => setImgError(true)}
        />
      ) : (
        <span
          className={[
            "flex h-full w-full select-none items-center justify-center text-2xl leading-none",
            `bg-gradient-to-br ${GLYPH_BG[kind]}`,
          ].join(" ")}
        >
          {glyph}
        </span>
      )}
      {earned && (
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-emerald-400 bg-black text-xs text-emerald-400">
          ✓
        </span>
      )}
    </div>
  );
}

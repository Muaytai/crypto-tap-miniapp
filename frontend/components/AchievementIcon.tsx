"use client";

import { useId } from "react";

type AchievementLike = {
  name: string;
  description: string;
  trigger_type: string;
  is_earned: boolean;
};

export type AchievementIconKind =
  | "taps"
  | "coins"
  | "items_wrench"
  | "items_hammer"
  | "items_lab"
  | "prestige"
  | "default";

export function achievementIconKind(ach: AchievementLike): AchievementIconKind {
  const text = `${ach.name} ${ach.description}`.toLowerCase();
  if (ach.trigger_type === "total_taps") return "taps";
  if (text.includes("плоскогуб")) return "items_wrench";
  if (text.includes("молот")) return "items_hammer";
  if (text.includes("лазер")) return "items_lab";
  if (text.includes("лаборатор") || text.includes("технопарк") || text.includes("мастерск")) return "items_lab";
  if (text.includes("крист")) return "prestige";
  if (ach.trigger_type === "prestige_count") return "prestige";
  if (ach.trigger_type === "total_coins_earned") return "coins";
  if (ach.trigger_type === "items_bought") return "items_wrench";
  return "default";
}

type IconProps = { uid: string };

function IconTaps({ uid }: IconProps) {
  const g = `taps-${uid}`;
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <defs>
        <linearGradient id={`${g}-a`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id={`${g}-b`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill={`url(#${g}-a)`} opacity="0.2" />
      <path
        fill={`url(#${g}-b)`}
        d="M10 20c0-1.5 1-2.5 2.5-2.5h1.5l2-6.5a2 2 0 0 1 3.8-.2l2.2 6.7H22c1.4 0 2.5 1.1 2.5 2.5v1H10v-1z"
      />
      <ellipse cx="16" cy="21.5" rx="7" ry="2" fill="#0c4a6e" opacity="0.35" />
    </svg>
  );
}

function IconCoins({ uid }: IconProps) {
  const g = `coins-${uid}`;
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <defs>
        <linearGradient id={`${g}-g`} x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id={`${g}-s`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#7dd3fc" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${g}-g)`}
        d="M16 4l10 5v8c0 5.5-4.5 10-10 12-5.5-2-10-6.5-10-12V9l10-5z"
        opacity="0.95"
      />
      <path fill={`url(#${g}-s)`} d="M16 7.5L9.5 11v6.2c0 4 3.4 7.4 6.5 8.8 3.1-1.4 6.5-4.8 6.5-8.8V11L16 7.5z" opacity="0.55" />
      <path fill="#0ea5e9" d="M12 14h8v2h-8v-2zm0 3.5h6v1.5h-6V17.5z" opacity="0.9" />
    </svg>
  );
}

function IconWrench({ uid }: IconProps) {
  const g = `wrench-${uid}`;
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <defs>
        <linearGradient id={`${g}-m`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4d4d8" />
          <stop offset="45%" stopColor="#71717a" />
          <stop offset="100%" stopColor="#3f3f46" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${g}-m)`}
        d="M23.2 5.8a5.5 5.5 0 0 0-7.8 0l-2.1 2.1 6.4 6.4 2.1-2.1a5.5 5.5 0 0 0 1.4-6.4zM14.3 8.8L6 17.1c-1.2 1.2-1.2 3.1 0 4.2l1.4 1.4c1.1 1.1 3 1.1 4.2 0l8.3-8.3-6.4-6.4z"
      />
      <circle cx="20" cy="7.5" r="2.2" fill="#a1a1aa" />
    </svg>
  );
}

function IconHammer({ uid }: IconProps) {
  const g = `hammer-${uid}`;
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <defs>
        <linearGradient id={`${g}-h`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>
        <linearGradient id={`${g}-w`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
      </defs>
      <rect x="5" y="10" width="16" height="8" rx="1.5" fill={`url(#${g}-h)`} transform="rotate(-35 13 14)" />
      <rect x="14" y="14" width="4" height="14" rx="1" fill={`url(#${g}-w)`} transform="rotate(-35 16 21)" />
    </svg>
  );
}

function IconLab({ uid }: IconProps) {
  const g = `lab-${uid}`;
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <defs>
        <linearGradient id={`${g}-l`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#4c1d95" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <path fill={`url(#${g}-l)`} d="M6 26V14l4-1v13H6zm7-15l3 1v14h-3V11zm6 3l4-2v14h-4V14zm6-5l3 1v16h-3V9z" opacity="0.95" />
      <rect x="4" y="26" width="24" height="3" rx="1" fill="#312e81" />
      <circle cx="10" cy="18" r="1.2" fill="#fbbf24" className="animate-ach-bubble" />
      <circle cx="17" cy="16" r="0.9" fill="#38bdf8" className="animate-ach-bubble-2" />
    </svg>
  );
}

function IconPrestige({ uid }: IconProps) {
  const g = `prestige-${uid}`;
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <defs>
        <linearGradient id={`${g}-p`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#e9d5ff" />
          <stop offset="40%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#581c87" />
        </linearGradient>
      </defs>
      <path fill={`url(#${g}-p)`} d="M16 3l3.8 7.7 8.5 1.2-6.1 5.9 1.4 8.5L16 23.9l-7.6 4 1.4-8.5-6.1-5.9 8.5-1.2L16 3z" />
      <path fill="#faf5ff" opacity="0.35" d="M16 8l2.2 4.5 4.9.7-3.5 3.4.8 4.9L16 19.8l-4.4 2.3.8-4.9-3.5-3.4 4.9-.7L16 8z" />
    </svg>
  );
}

function IconMedal({ uid }: IconProps) {
  const g = `medal-${uid}`;
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <defs>
        <linearGradient id={`${g}-m`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="14" r="9" fill={`url(#${g}-m)`} />
      <circle cx="16" cy="14" r="6" fill="#78350f" opacity="0.35" />
      <path fill="#b45309" d="M11 23h10l-1.5 6h-7L11 23z" />
    </svg>
  );
}

type Props = {
  achievement: AchievementLike;
  /** 0–100, для лёгкой анимации «в процессе» */
  progressPct: number;
};

export function AchievementIcon({ achievement, progressPct }: Props) {
  const uid = useId().replace(/:/g, "").replace(/\./g, "");
  const kind = achievementIconKind(achievement);
  const earned = achievement.is_earned;
  const inProgress = !earned && progressPct > 0 && progressPct < 100;

  const icon =
    kind === "taps" ? (
      <IconTaps uid={uid} />
    ) : kind === "coins" ? (
      <IconCoins uid={uid} />
    ) : kind === "items_wrench" ? (
      <IconWrench uid={uid} />
    ) : kind === "items_hammer" ? (
      <IconHammer uid={uid} />
    ) : kind === "items_lab" ? (
      <IconLab uid={uid} />
    ) : kind === "prestige" ? (
      <IconPrestige uid={uid} />
    ) : (
      <IconMedal uid={uid} />
    );

  return (
    <div
      className={[
        "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br shadow-inner",
        earned
          ? "animate-ach-gold-ring border-[#f6cd2d]/55 from-[#2a2618] to-[#141a22] shadow-[0_0_20px_rgba(246,205,45,0.22)]"
          : inProgress
            ? "animate-ach-cyan-glow border-cyan-500/35 from-[#13202a] to-[#0f1419] [&_svg]:animate-float"
            : "border-[#2f3b47]/80 from-[#151a20] to-[#0d1117] [&_svg]:opacity-[0.72] [&_svg]:[filter:saturate(0.55)_brightness(0.88)]",
      ].join(" ")}
    >
      <span className="relative z-[1] flex items-center justify-center">{icon}</span>
      {earned ? (
        <span
          className="pointer-events-none absolute inset-[-1px] rounded-xl [animation:ach-shine_3.2s_linear_infinite] [background-size:220%_100%] [background:linear-gradient(115deg,transparent_36%,rgba(255,255,255,0.14)_48%,transparent_58%)]"
          aria-hidden
        />
      ) : null}
    </div>
  );
}

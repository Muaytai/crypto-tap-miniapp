"use client";

import { CrystalDiamondIcon } from "@/components/CrystalDiamondIcon";

type CelestialUpgradeCardProps = {
  name: string;
  description: string;
  icon: string;
  currentLevel: number;
  maxLevel: number;
  priceCrystals: number;
  canAfford: boolean;
  isMax: boolean;
  loading?: boolean;
  onBuy: () => void;
};

export function CrystalCost({
  amount,
  className = "",
  variant = "default",
}: {
  amount: number;
  className?: string;
  variant?: "default" | "buyButton" | "buyButtonOnOrange";
}) {
  const isBuy = variant === "buyButton" || variant === "buyButtonOnOrange";
  const onOrange = variant === "buyButtonOnOrange";
  return (
    <span className={`inline-flex items-center gap-0.5 tabular-nums ${className}`}>
      <CrystalDiamondIcon size={isBuy ? "xs" : "sm"} />
      <span className={isBuy ? (onOrange ? "text-white" : "text-[#8A8B8C]") : undefined}>{amount}</span>
    </span>
  );
}

export function getCelestialUpgradeIcon(upgradeType: string, iconName?: string): string {
  if (iconName) return iconName;
  switch (upgradeType) {
    case "start_boost":
      return "💎";
    case "tap_bonus":
      return "👆";
    case "offline_boost":
      return "⏰";
    case "auto_tap":
      return "⚙️";
    case "global_income":
      return "💠";
    default:
      return "✨";
  }
}

export function CelestialUpgradeCard({
  name,
  description,
  icon,
  currentLevel,
  maxLevel,
  priceCrystals,
  canAfford,
  isMax,
  loading = false,
  onBuy,
}: CelestialUpgradeCardProps) {
  const disabled = isMax || !canAfford || loading;
  const progressPct =
    maxLevel > 0 ? Math.min(100, Math.round((currentLevel / maxLevel) * 100)) : 0;

  return (
    <article className="rounded-2xl border border-[#3a2a3c] bg-[#2B1D2D] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-purple-700/30 bg-[#2f2240] text-2xl"
          aria-hidden
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-[15px] font-bold leading-tight text-white">{name}</h4>
            <p className="shrink-0 text-[11px] font-medium text-zinc-400">
              Уровень: {currentLevel}/{maxLevel}
            </p>
          </div>
          <p className="mt-1.5 text-[12px] leading-snug text-zinc-400">{description}</p>
          <p className="mt-2 text-[13px] font-semibold text-zinc-300">
            <CrystalCost amount={priceCrystals} />
          </p>
        </div>
      </div>

      <div
        className="my-3"
        role="progressbar"
        aria-valuenow={currentLevel}
        aria-valuemin={0}
        aria-valuemax={maxLevel}
        aria-label={`Прогресс уровня: ${currentLevel} из ${maxLevel}`}
      >
        <div className="h-1.5 overflow-hidden rounded-full bg-[#3D2D3D]">
          <div
            className="h-full rounded-full bg-[#5a4858] transition-[width] duration-300"
            style={{ width: `${progressPct}%`, minWidth: progressPct > 0 ? "0.35rem" : 0 }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onBuy}
        disabled={disabled}
        className={`tap-target flex w-full items-center justify-center gap-2 rounded-xl border border-transparent py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] transition active:scale-[0.98] ${
          isMax
            ? "bg-[#242526] text-[#6b9e6b]"
            : canAfford
              ? "bg-gradient-to-b from-[#F59E0B] via-[#EA580C] to-[#9A3412] text-white shadow-[0_3px_8px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.15)_inset] hover:brightness-[1.05]"
              : "bg-[#1e1f21] text-[#5c5d5e]"
        } disabled:pointer-events-none disabled:opacity-80`}
      >
        {loading ? (
          "..."
        ) : isMax ? (
          "Куплено"
        ) : (
          <>
            <span className={canAfford ? "text-white" : undefined}>Купить</span>
            <CrystalCost
              amount={priceCrystals}
              variant={canAfford ? "buyButtonOnOrange" : "buyButton"}
            />
          </>
        )}
      </button>
    </article>
  );
}

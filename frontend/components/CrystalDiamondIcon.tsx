/** Алмаз как на вкладке «Закал.» в доке (💎). */
const SIZE_CLASS = {
  xs: "text-[12px] leading-none",
  sm: "text-[14px] leading-none",
  md: "text-[18px] leading-none",
  lg: "text-[26px] leading-none",
} as const;

type Props = {
  className?: string;
  size?: keyof typeof SIZE_CLASS;
};

export function CrystalDiamondIcon({ className = "", size = "sm" }: Props) {
  return (
    <span
      className={`inline-block shrink-0 select-none ${SIZE_CLASS[size]} ${className}`}
      aria-hidden
    >
      💎
    </span>
  );
}

type Props = {
  className?: string;
};

/** Нижняя белая полоса как у @bot в референсе мини-приложения. */
export function PowerCxtWatermark({ className = "" }: Props) {
  return (
    <footer
      className={`z-30 w-full shrink-0 bg-white px-3 py-2.5 pb-[max(0.35rem,env(safe-area-inset-bottom,0px))] ${className}`}
      role="contentinfo"
    >
      <p
        className="text-center text-[15px] font-normal leading-snug tracking-normal text-[#5a5a5a] [font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Helvetica,Arial,sans-serif]"
      >
        @POWERCXT
      </p>
    </footer>
  );
}

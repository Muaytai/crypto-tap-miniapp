"use client";

import { useEffect, useState } from "react";
import { loadGameSettings, patchGameSettings, type GameSettings } from "@/lib/gameSettings";

type Props = {
  open: boolean;
  onClose: () => void;
};

function ToggleRow(props: {
  icon: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const { icon, title, description, checked, onChange } = props;
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#1e2638]/90 px-3 py-3">
      <span className="shrink-0 text-2xl leading-none" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`tap-target h-7 w-12 shrink-0 rounded-full p-0.5 transition-colors duration-200 ${
          checked ? "bg-sky-500" : "bg-zinc-600"
        }`}
      >
        <span
          className={`pointer-events-none block h-6 w-6 rounded-full bg-white shadow ring-1 ring-black/10 transition-[margin-inline-start] duration-200 ease-out ${
            checked ? "ms-5" : "ms-0"
          }`}
        />
      </button>
    </div>
  );
}

export function SettingsModal({ open, onClose }: Props) {
  const [s, setS] = useState<GameSettings>(loadGameSettings);

  useEffect(() => {
    if (!open) return;
    setS(loadGameSettings());
  }, [open]);

  useEffect(() => {
    const handler = () => setS(loadGameSettings());
    window.addEventListener("crypto-tap-settings-changed", handler);
    return () => window.removeEventListener("crypto-tap-settings-changed", handler);
  }, []);

  const update = (partial: Partial<GameSettings>) => {
    setS(patchGameSettings(partial));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-[360px] rounded-2xl border border-sky-500/35 bg-[#161d2e] p-4 text-white shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="settings-title" className="text-center text-lg font-semibold text-white">
          Настройки
        </h2>

        <div className="mt-4 flex flex-col gap-2.5">
          <ToggleRow
            icon="🔊"
            title="Звуки"
            description="Клики, достижения, взрывы"
            checked={s.sound}
            onChange={(v) => update({ sound: v })}
          />
          <ToggleRow
            icon="🎵"
            title="Музыка"
            description="Фоновый lo-fi"
            checked={s.music}
            onChange={(v) => update({ music: v })}
          />
          <ToggleRow
            icon="📳"
            title="Вибрация"
            description="Отклик при нажатии"
            checked={s.vibration}
            onChange={(v) => update({ vibration: v })}
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="tap-target mt-5 w-full rounded-xl bg-gradient-to-b from-sky-500 to-sky-600 py-3 text-center text-sm font-semibold text-white shadow-[0_4px_0_#0369a1] active:translate-y-px"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { loadGameSettings, patchGameSettings, type GameSettings } from "@/lib/gameSettings";

type Props = {
  open: boolean;
  onClose: () => void;
};

function ToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-zinc-950/80 border border-white/10 p-4">
      <span className="text-3xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white">{title}</p>
        <p className="text-xs text-zinc-400 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`tap-target h-8 w-14 rounded-full p-1 transition-all ${checked ? "bg-cyan-500" : "bg-zinc-700"}`}
      >
        <div
          className={`h-6 w-6 rounded-full bg-white transition-all ${checked ? "translate-x-6" : ""}`}
        />
      </button>
    </div>
  );
}

export function SettingsModal({ open, onClose }: Props) {
  const [settings, setSettings] = useState<GameSettings>(loadGameSettings);

  useEffect(() => {
    if (open) setSettings(loadGameSettings());
  }, [open]);

  const update = (partial: Partial<GameSettings>) => {
    const newSettings = patchGameSettings(partial);
    setSettings(newSettings);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-12">
      <div
        className="w-full max-w-[380px] rounded-3xl border border-cyan-400/30 bg-[#0a0f1c] p-6 shadow-2xl animate-modal-slide-down"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-pixel text-2xl text-center text-cyan-300">НАСТРОЙКИ</h2>

        <div className="mt-6 flex flex-col gap-3">
          <ToggleRow
            icon="🔊"
            title="Звуки"
            description="Клики, награды, эффекты"
            checked={settings.sound}
            onChange={(v) => update({ sound: v })}
          />
          <ToggleRow
            icon="🎵"
            title="Музыка"
            description="Фоновая музыка"
            checked={settings.music}
            onChange={(v) => update({ music: v })}
          />
          <ToggleRow
            icon="📳"
            title="Вибрация"
            description="Тактильная отдача"
            checked={settings.vibration}
            onChange={(v) => update({ vibration: v })}
          />
        </div>

        <button
          onClick={onClose}
          className="tap-target mt-8 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 text-white font-bold"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
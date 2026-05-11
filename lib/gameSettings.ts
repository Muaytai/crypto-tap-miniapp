/**
 * Локальные настройки игры (звук / музыка / вибрация), без бэкенда.
 */

const STORAGE_KEY = "crypto-tap-game-settings-v1";

export type GameSettings = {
  sound: boolean;
  music: boolean;
  vibration: boolean;
};

const DEFAULTS: GameSettings = {
  sound: false,
  music: false,
  vibration: true,
};

export function loadGameSettings(): GameSettings {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return {
      sound: Boolean(parsed.sound),
      music: Boolean(parsed.music),
      vibration: parsed.vibration !== undefined ? Boolean(parsed.vibration) : DEFAULTS.vibration,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveGameSettings(next: GameSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("crypto-tap-settings-changed", { detail: next }));
  } catch {
    // ignore quota / private mode
  }
}

export function patchGameSettings(partial: Partial<GameSettings>): GameSettings {
  const merged = { ...loadGameSettings(), ...partial };
  saveGameSettings(merged);
  return merged;
}

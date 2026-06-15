import { loadGameSettings } from "@/lib/gameSettings";

export type GameSoundId = "click" | "success" | "error";

const SOUND_URLS: Record<GameSoundId, string> = {
  click: "/sounds/click_002.wav",
  success: "/sounds/confirmation_001.wav",
  error: "/sounds/error_004.wav",
};

const audioPool = new Map<GameSoundId, HTMLAudioElement>();

function getAudio(id: GameSoundId): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;

  let audio = audioPool.get(id);
  if (!audio) {
    audio = new Audio(SOUND_URLS[id]);
    audio.preload = "auto";
    audioPool.set(id, audio);
  }
  return audio;
}

/** Проигрывает UI-звук, если включены «Звуки» в настройках. */
export function playGameSound(id: GameSoundId, force = false): void {
  if (!force && !loadGameSettings().sound) return;

  const audio = getAudio(id);
  if (!audio) return;

  audio.currentTime = 0;
  void audio.play().catch(() => {
    // Браузер может блокировать до первого жеста пользователя
  });
}

/** Короткая вибрация при тапе, если включена в настройках. */
export function triggerTapVibration(): void {
  if (!loadGameSettings().vibration) return;
  try {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
  } catch {
    // ignore
  }
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(12);
  }
}

/** Звук клика + вибрация — для кнопки тапа. */
export function playTapFeedback(): void {
  playGameSound("click");
  triggerTapVibration();
}

if (typeof window !== "undefined") {
  (Object.keys(SOUND_URLS) as GameSoundId[]).forEach((id) => {
    getAudio(id);
  });
}

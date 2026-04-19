/**
 * Звук: сначала сэмплы из /public/sounds (Kenney CC0, см. CREDITS.txt),
 * при ошибке воспроизведения — запасной синтезатор (Web Audio).
 * Тактильный ответ в Telegram Mini App (HapticFeedback).
 */

import { getTelegramWebApp } from "@/lib/telegram";

export type PowercxtSound = "tap" | "success" | "warn";

const SAMPLE_URLS: Record<PowercxtSound, string> = {
  tap: "/sounds/click_002.wav",
  success: "/sounds/confirmation_001.wav",
  warn: "/sounds/error_004.wav",
};

const SAMPLE_VOLUME: Record<PowercxtSound, number> = {
  tap: 0.38,
  success: 0.42,
  warn: 0.4,
};

let audioCtx: AudioContext | null = null;
let samplesPrimed = false;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    audioCtx ??= new AudioContext();
    return audioCtx;
  } catch {
    return null;
  }
}

export function isPowercxtMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("powercxt_mute") === "1";
  } catch {
    return false;
  }
}

export function setPowercxtMuted(muted: boolean): void {
  try {
    localStorage.setItem("powercxt_mute", muted ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** Предзагрузка в кэш браузера (после монтирования клиента). */
export function preloadPowercxtSamples(): void {
  if (typeof window === "undefined" || samplesPrimed) return;
  samplesPrimed = true;
  (Object.values(SAMPLE_URLS) as string[]).forEach((src) => {
    const a = new Audio();
    a.preload = "auto";
    a.src = src;
    void a.load();
  });
}

function triggerHaptic(kind: PowercxtSound): void {
  const twa = getTelegramWebApp();
  const h = twa?.HapticFeedback;
  if (!h) return;
  try {
    if (kind === "tap" && typeof h.impactOccurred === "function") {
      h.impactOccurred("light");
    } else if (kind === "success" && typeof h.notificationOccurred === "function") {
      h.notificationOccurred("success");
    } else if (typeof h.notificationOccurred === "function") {
      h.notificationOccurred("warning");
    }
  } catch {
    /* ignore */
  }
}

function playOscillatorFallback(kind: PowercxtSound): void {
  const c = ctx();
  if (!c) return;
  if (c.state === "suspended") {
    void c.resume();
  }

  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.connect(gain);
  gain.connect(c.destination);

  if (kind === "tap") {
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.04);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.start(now);
    osc.stop(now + 0.07);
  } else if (kind === "success") {
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.setValueAtTime(880, now + 0.08);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.16);
  } else {
    osc.frequency.setValueAtTime(220, now);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.11);
  }
}

export function playPowercxtSound(kind: PowercxtSound): void {
  if (typeof window === "undefined" || isPowercxtMuted()) return;

  triggerHaptic(kind);

  const src = SAMPLE_URLS[kind];
  const audio = new Audio(src);
  audio.volume = SAMPLE_VOLUME[kind];
  const p = audio.play();
  if (p !== undefined) {
    p.catch(() => {
      playOscillatorFallback(kind);
    });
  }
}

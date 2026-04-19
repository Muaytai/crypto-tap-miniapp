/** Короткие звуки без внешних файлов (Web Audio). Уважает powercxt_mute в localStorage. */

let audioCtx: AudioContext | null = null;

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

export type PowercxtSound = "tap" | "success" | "warn";

export function playPowercxtSound(kind: PowercxtSound): void {
  if (typeof window === "undefined" || isPowercxtMuted()) return;
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

export type TelegramWebAppLike = {
  ready: () => void;
  expand: () => void;
  openLink?: (url: string) => void;
  initData: string;
  initDataUnsafe: Record<string, unknown>;
  version: string;
  platform: string;
  HapticFeedback?: {
    impactOccurred?: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred?: (type: "error" | "success" | "warning") => void;
  };
  onEvent?: (eventType: string, eventHandler: () => void) => void;
  offEvent?: (eventType: string, eventHandler: () => void) => void;
};

type TelegramDockTab = "game" | "profile" | "top";

/** Достаём query-часть из hash (как в telegram-web-app.js): `tgWebAppData=…` или `profile?tgWebAppData=…`. */
function telegramHashQueryString(): string {
  if (typeof window === "undefined") return "";
  const fragment = window.location.hash.replace(/^#/, "");
  if (!fragment) return "";
  const qIdx = fragment.indexOf("?");
  if (qIdx >= 0) return fragment.slice(qIdx + 1);
  if (fragment.includes("=")) return fragment;
  return "";
}

/** Сырые tgWebApp* из адресной строки (если WebApp.initData ещё пустой). */
function tgWebAppParamsFromLocationHash(): Record<string, string> {
  const q = telegramHashQueryString();
  if (!q) return {};
  const out: Record<string, string> = {};
  const sp = new URLSearchParams(q);
  for (const key of sp.keys()) {
    if (!key.startsWith("tgWebApp")) continue;
    const v = sp.get(key);
    if (v != null && v.length > 0) out[key] = v;
  }
  return out;
}

function initDataFromLocationHash(): string {
  const p = tgWebAppParamsFromLocationHash();
  return p.tgWebAppData ?? "";
}

/** Telegram SDK кладёт объединённые initParams в sessionStorage при старте. */
function initDataFromTelegramSessionStorage(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.sessionStorage.getItem("__telegram__initParams");
    if (!raw) return "";
    const params = JSON.parse(raw) as Record<string, unknown>;
    const d = params.tgWebAppData;
    return typeof d === "string" && d.length > 0 ? d : "";
  } catch {
    return "";
  }
}

/** Парсер хэша совместим с вкладками: #profile, #top, #profile?tgWebAppData=… */
export function dockTabFromHash(): TelegramDockTab {
  if (typeof window === "undefined") return "game";
  let h = window.location.hash.replace(/^#/, "");
  const q = h.indexOf("?");
  if (q >= 0) h = h.slice(0, q);
  if (h === "profile") return "profile";
  if (h === "top") return "top";
  return "game";
}

/**
 * Telegram кладёт tgWebAppData только в hash. Нельзя заменять hash на #profile без параметров —
 * после Reload в клиенте initData пустой. Берём tgWebApp* из Telegram.WebView.initParams.
 */
export function historyUrlForDockTab(pathnameAndSearch: string, tab: TelegramDockTab): string {
  if (typeof window === "undefined") return pathnameAndSearch;
  const initParams = (
    window as unknown as {
      Telegram?: { WebView?: { initParams?: Record<string, string | undefined> } };
    }
  ).Telegram?.WebView?.initParams;
  const sp = new URLSearchParams();
  if (initParams) {
    for (const key of Object.keys(initParams)) {
      if (!key.startsWith("tgWebApp")) continue;
      const val = initParams[key];
      if (val != null && String(val).length > 0) sp.set(key, String(val));
    }
  }
  if (!sp.has("tgWebAppData")) {
    const fromHash = tgWebAppParamsFromLocationHash();
    for (const key of Object.keys(fromHash)) {
      if (!sp.has(key)) sp.set(key, fromHash[key]);
    }
  }
  const q = sp.toString();
  const seg = tab === "profile" ? "profile" : tab === "top" ? "top" : "";
  let fragment = "";
  if (q && seg) fragment = `#${seg}?${q}`;
  else if (q) fragment = `#?${q}`;
  else if (seg) fragment = `#${seg}`;
  return `${pathnameAndSearch}${fragment}`;
}

export function getTelegramWebApp(): TelegramWebAppLike | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Telegram?: { WebApp?: TelegramWebAppLike } }).Telegram
    ?.WebApp;
}

/**
 * Некоторые клиенты (Telegram Desktop) отдают initData с задержкой; хэш # в URL кнопки Web App
 * тоже может мешать. Опрашиваем WebApp, плюс focus / viewport_changed.
 */
export function watchTelegramInitData(onData: (initData: string) => void): () => void {
  let cancelled = false;
  let intervalId: number | undefined;

  const tryRead = (): boolean => {
    if (cancelled) return false;
    const twa = getTelegramWebApp();
    if (twa) {
      twa.ready();
      twa.expand();
    }
    let raw = (twa?.initData || "").trim();
    if (!raw) {
      raw =
        initDataFromLocationHash().trim() ||
        initDataFromTelegramSessionStorage().trim();
    }
    if (raw) {
      onData(raw);
      return true;
    }
    return false;
  };

  const stopInterval = () => {
    if (intervalId !== undefined) {
      window.clearInterval(intervalId);
      intervalId = undefined;
    }
  };

  if (tryRead()) {
    return () => {
      cancelled = true;
    };
  }

  const started = Date.now();
  const TIMEOUT_MS = 30000;
  intervalId = window.setInterval(() => {
    if (cancelled) return;
    if (tryRead()) {
      stopInterval();
      return;
    }
    if (Date.now() - started > TIMEOUT_MS) stopInterval();
  }, 100);

  const onVis = () => {
    if (!cancelled && document.visibilityState === "visible" && tryRead()) stopInterval();
  };
  const onFocus = () => {
    if (!cancelled && tryRead()) stopInterval();
  };
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("focus", onFocus);
  const onHashChange = () => {
    if (!cancelled && tryRead()) stopInterval();
  };
  window.addEventListener("hashchange", onHashChange);

  const onViewport = () => {
    if (!cancelled && tryRead()) stopInterval();
  };
  const twa0 = getTelegramWebApp();
  if (twa0 && typeof twa0.onEvent === "function") {
    twa0.onEvent("viewport_changed", onViewport);
  }

  return () => {
    cancelled = true;
    stopInterval();
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("focus", onFocus);
    window.removeEventListener("hashchange", onHashChange);
    const twa = getTelegramWebApp();
    if (twa && typeof twa.offEvent === "function") {
      twa.offEvent("viewport_changed", onViewport);
    }
  };
}

const configuredBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

function isLoopbackApiBase(base: string): boolean {
  if (!base) return false;
  try {
    const u = new URL(base);
    return u.hostname === "localhost" || u.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/** Страница с HTTPS-туннеля: прямой fetch на http://127.0.0.1 — mixed content / недоступен. Идём на тот же origin → Next proxy. */
function useSameOriginApiInBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  const pageOnLoopback = h === "localhost" || h === "127.0.0.1";
  return Boolean(configuredBase && isLoopbackApiBase(configuredBase) && !pageOnLoopback);
}

/** Django APPEND_SLASH: путь без `/` перед `?` даёт 301 и ломает fetch в части WebView. */
function ensureApiTrailingSlash(path: string): string {
  if (!path.startsWith("/api/")) return path;
  const q = path.indexOf("?");
  const base = q >= 0 ? path.slice(0, q) : path;
  const query = q >= 0 ? path.slice(q) : "";
  if (base.endsWith("/") || base.length <= 5) return path;
  if (/\.[a-zA-Z0-9]{2,12}$/.test(base)) return path;
  return `${base}/${query}`;
}

/**
 * `/api/...` относительно текущего origin проксируется на Django в `next.config.ts`.
 * При туннеле и NEXT_PUBLIC_API_URL=http://127.0.0.1:8000 обязательно same-origin.
 */
export function apiUrl(path: string): string {
  let p = path.startsWith("/") ? path : `/${path}`;
  p = ensureApiTrailingSlash(p);
  const base = useSameOriginApiInBrowser() ? "" : configuredBase;
  if (base) {
    return `${base}${p}`;
  }
  return p;
}

export async function apiFetch(
  path: string,
  init: RequestInit & { initData?: string },
) {
  const { initData, headers, ...rest } = init;
  const h = new Headers(headers);
  if (initData) {
    h.set("X-Telegram-Init-Data", initData);
  }
  const res = await fetch(apiUrl(path), {
    ...rest,
    cache: "no-store",
    headers: h,
    redirect: "follow",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

/** GET без Telegram-заголовка (публичные эндпоинты). */
export async function fetchPublicJson(path: string): Promise<unknown> {
  const res = await fetch(apiUrl(path), { redirect: "follow", cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export async function apiFetchWithRetry(
  path: string,
  init: RequestInit & { initData?: string } = {},
  retries = 2,
): Promise<unknown> {
  let last: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await apiFetch(path, init);
    } catch (e) {
      last = e;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      }
    }
  }
  throw last;
}

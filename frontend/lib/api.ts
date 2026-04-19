const configuredBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

/** Relative `/api/...` is proxied to Django via `next.config.ts` when `NEXT_PUBLIC_API_URL` is unset. */
export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (configuredBase) {
    return `${configuredBase}${p}`;
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
  const res = await fetch(apiUrl(path), { ...rest, headers: h });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

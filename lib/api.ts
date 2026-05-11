/**
 * Клиент DRF для мини-приложения. Соответствие экранам как в idle-игре:
 * - state, shop/buy — магазин предметов (+/сек); taps/sync — ручной тап;
 * - upgrades/buy — вкладка улучшений; prestige — «закалка»; celestial — пост-престиж;
 * - achievements, daily-reward — цели/бонусы; leaderboard — топ (на главной вкладке можно подключить).
 */
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

// ========== НОВЫЕ МЕТОДЫ API ==========

export type PlayerState = {
  player: {
    telegram_id: number;
    username: string;
    first_name: string;
    coins: number;
    total_taps: number;
    crystals: number;
    total_earned_all_time: number;
    prestige_count: number;
    max_offline_minutes: number;
  };
  items: Array<{
    item_id: number;
    item_name: string;
    quantity: number;
    item_base_income: number;
  }>;
  upgrades: Array<{
    upgrade_id: number;
    upgrade_name: string;
  }>;
  available_items: Array<{
    id: number;
    name: string;
    base_income_per_second: number;
    base_price: number;
  }>;
  available_upgrades: Array<{
    id: number;
    name: string;
    upgrade_type: string;
    value: number;
    base_price: number;
    min_total_taps: number;
  }>;
  income_per_second: number;
};

export async function fetchFullState(initData: string): Promise<PlayerState> {
  return apiFetch("/api/state/", { initData }) as Promise<PlayerState>;
}

export async function buyItem(
  initData: string,
  itemId: number,
  quantity: number = 1
): Promise<{
  success: boolean;
  item_name: string;
  quantity_bought: number;
  new_quantity: number;
  total_price: number;
  coins_left: number;
  cached_income_per_second: number;
}> {
  return apiFetch("/api/shop/buy/", {
    method: "POST",
    initData,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item_id: itemId, quantity }),
  }) as Promise<any>;
}

export async function buyUpgrade(
  initData: string,
  upgradeId: number
): Promise<{
  success: boolean;
  upgrade_name: string;
  upgrade_type: string;
  coins_left: number;
}> {
  return apiFetch("/api/upgrades/buy/", {
    method: "POST",
    initData,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ upgrade_id: upgradeId }),
  }) as Promise<any>;
}

export async function performPrestige(
  initData: string
): Promise<{
  success: boolean;
  prestige_count: number;
  crystals_earned: number;
  total_crystals: number;
}> {
  return apiFetch("/api/prestige/", {
    method: "POST",
    initData,
  }) as Promise<any>;
}

export async function getPrestigeStatus(initData: string): Promise<{
  can_prestige: boolean;
  total_earned_all_time: number;
  prestige_threshold: number;
  current_prestige_count: number;
  crystals: number;
}> {
  return apiFetch("/api/prestige/", { initData }) as Promise<any>;
}

/** Статус ежедневки без начисления (GET). */
export type DailyRewardStatus = {
  can_claim: boolean;
  current_streak: number;
  max_streak: number;
  last_claim_date?: string | null;
  streak_display: number;
  next_reward_day: number;
  day_slot: number;
  reward_coins: number;
  reward_crystals: number;
  days_to_weekly_bonus: number;
  weekly_bonus_crystals: number;
  message: string;
};

function isLocalDailyMock(initData: string): boolean {
  return initData === "dev" || initData === "test_init_data";
}

function buildMockDailyStatus(claimedToday = false): DailyRewardStatus {
  const daySlot = 1;
  return {
    can_claim: !claimedToday,
    current_streak: 0,
    max_streak: 3,
    last_claim_date: claimedToday ? new Date().toISOString().slice(0, 10) : null,
    streak_display: 1,
    next_reward_day: 1,
    day_slot: daySlot,
    reward_coins: 1_000,
    reward_crystals: 0,
    days_to_weekly_bonus: 7 - daySlot,
    weekly_bonus_crystals: 5,
    message: claimedToday ? "Награда уже получена сегодня. Загляните завтра!" : "",
  };
}

export async function fetchDailyRewardStatus(initData: string): Promise<DailyRewardStatus> {
  if (isLocalDailyMock(initData)) {
    return buildMockDailyStatus(false);
  }
  return apiFetch("/api/daily-reward/", { initData }) as Promise<DailyRewardStatus>;
}

/** Забрать награду за сегодня (POST). */
export async function claimDailyReward(initData: string): Promise<DailyRewardStatus> {
  if (isLocalDailyMock(initData)) {
    return buildMockDailyStatus(true);
  }
  return apiFetch("/api/daily-reward/", { initData, method: "POST" }) as Promise<DailyRewardStatus>;
}

export async function fetchAchievements(initData: string): Promise<{
  achievements: Array<{
    id: number;
    name: string;
    description: string;
    trigger_type: string;
    trigger_value: number;
    reward_crystals: number;
    reward_coins: number;
    is_earned: boolean;
  }>;
  new_achievements: Array<any>;
}> {
  return apiFetch("/api/achievements/", { initData }) as Promise<any>;
}

export async function fetchCelestialUpgrades(initData: string): Promise<
  Array<{
    id: number;
    name: string;
    description: string;
    upgrade_type: string;
    value: number;
    price_crystals: number;
    max_level: number;
  }>
> {
  return apiFetch("/api/celestial-upgrades/", { initData }) as Promise<any>;
}

export async function buyCelestialUpgrade(
  initData: string,
  upgradeId: number
): Promise<{
  success: boolean;
  upgrade_id: number;
  upgrade_name: string;
  new_level: number;
  crystals_left: number;
}> {
  return apiFetch("/api/celestial/buy/", {
    method: "POST",
    initData,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ upgrade_id: upgradeId }),
  }) as Promise<any>;
}

export type LeaderboardMetric = "earnings" | "crystals" | "prestige";

export type LeaderboardRow = {
  rank: number;
  telegram_id: number;
  first_name: string;
  username: string;
  photo_url: string;
  score: number;
};

export async function fetchLeaderboard(
  initData: string,
  metric: LeaderboardMetric,
  limit = 50,
): Promise<{
  metric: string;
  total_players: number;
  results: LeaderboardRow[];
  me_rank?: number;
  me?: PlayerState["player"];
}> {
  const q = new URLSearchParams({ metric, limit: String(limit) });
  return apiFetch(`/api/leaderboard/?${q.toString()}`, { initData }) as Promise<{
    metric: string;
    total_players: number;
    results: LeaderboardRow[];
    me_rank?: number;
    me?: PlayerState["player"];
  }>;
}

export async function syncTaps(
  initData: string,
  tapsDelta: number,
  coinsDelta: number = 0
): Promise<{
  player: PlayerState["player"];
  income_per_second: number;
  click_multiplier: number;
}> {
  return apiFetch("/api/taps/sync/", {
    method: "POST",
    initData,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taps_delta: tapsDelta, coins_delta: coinsDelta }),
  }) as Promise<any>;
}

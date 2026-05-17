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

/** Локальная игра без Telegram (DevHome / test_init_data): не ходим на защищённые DRF-эндпоинты. */
export function isLocalDevMock(initData: string): boolean {
  return initData === "dev" || initData === "test_init_data";
}

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
  initData: string,
  devPlayer?: Pick<PlayerState["player"], "total_earned_all_time" | "prestige_count" | "crystals">,
): Promise<{
  success: boolean;
  prestige_count: number;
  crystals_earned: number;
  total_crystals: number;
}> {
  if (isLocalDevMock(initData)) {
    const p = devPlayer;
    if (!p) {
      throw new Error("Local dev prestige requires player snapshot");
    }
    const PRESTIGE_THRESHOLD = 500_000_000_000;
    if (p.total_earned_all_time < PRESTIGE_THRESHOLD) {
      return {
        success: false,
        prestige_count: p.prestige_count,
        crystals_earned: 0,
        total_crystals: p.crystals,
      };
    }
    const excess = p.total_earned_all_time - PRESTIGE_THRESHOLD;
    const crystalsEarned = Math.max(1, Math.floor(excess / 100_000_000_000));
    return {
      success: true,
      prestige_count: p.prestige_count + 1,
      crystals_earned: crystalsEarned,
      total_crystals: p.crystals + crystalsEarned,
    };
  }
  return apiFetch("/api/prestige/", {
    method: "POST",
    initData,
  }) as Promise<any>;
}

export async function getPrestigeStatus(
  initData: string,
  devPlayer?: Pick<PlayerState["player"], "total_earned_all_time" | "prestige_count" | "crystals">,
): Promise<{
  can_prestige: boolean;
  total_earned_all_time: number;
  prestige_threshold: number;
  current_prestige_count: number;
  crystals: number;
}> {
  if (isLocalDevMock(initData)) {
    const PRESTIGE_THRESHOLD = 500_000_000_000;
    const p = devPlayer ?? {
      total_earned_all_time: 0,
      prestige_count: 0,
      crystals: 0,
    };
    return {
      can_prestige: p.total_earned_all_time >= PRESTIGE_THRESHOLD,
      total_earned_all_time: p.total_earned_all_time,
      prestige_threshold: PRESTIGE_THRESHOLD,
      current_prestige_count: p.prestige_count,
      crystals: p.crystals,
    };
  }
  return apiFetch("/api/prestige/", { initData }) as Promise<any>;
}

/** Одна ячейка сетки «день 1 … 7» для ежедневной награды. */
export type DailyRewardDaySlot = {
  day: number;
  reward_coins: number;
  reward_crystals: number;
  status: "claimed" | "claimable" | "locked";
};

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
  /** Сетка из 7 дней с наградами и состоянием (сервер; при отсутствии — собрать на клиенте). */
  day_schedule?: DailyRewardDaySlot[];
  message: string;
};

/** Базовые награды по дням (совпадают с seed_daily_rewards); без статуса. */
export const DAILY_REWARD_TEMPLATE: Omit<DailyRewardDaySlot, "status">[] = [
  { day: 1, reward_coins: 1_000, reward_crystals: 0 },
  { day: 2, reward_coins: 2_500, reward_crystals: 0 },
  { day: 3, reward_coins: 5_000, reward_crystals: 0 },
  { day: 4, reward_coins: 10_000, reward_crystals: 0 },
  { day: 5, reward_coins: 20_000, reward_crystals: 0 },
  { day: 6, reward_coins: 40_000, reward_crystals: 0 },
  { day: 7, reward_coins: 0, reward_crystals: 5 },
];

/** Если бэкенд ещё без day_schedule — собираем так же, как в API. */
export function resolveDailyDaySchedule(status: DailyRewardStatus): DailyRewardDaySlot[] {
  if (status.day_schedule && status.day_schedule.length === 7) {
    return status.day_schedule;
  }
  const base = DAILY_REWARD_TEMPLATE.map((row) => ({
    reward_coins: row.reward_coins,
    reward_crystals: row.reward_crystals,
    day: row.day,
  }));
  if (status.can_claim) {
    const claimSlot = ((Math.max(status.next_reward_day, 1) - 1) % 7) + 1;
    return base.map((row) => ({
      ...row,
      status:
        row.day < claimSlot ? "claimed" : row.day === claimSlot ? ("claimable" as const) : ("locked" as const),
    }));
  }
  const lastSlot = ((Math.max(status.current_streak, 1) - 1) % 7) + 1;
  return base.map((row) => ({
    ...row,
    status: row.day <= lastSlot ? ("claimed" as const) : ("locked" as const),
  }));
}
function buildMockDailyStatus(claimedToday = false): DailyRewardStatus {
  const daySlot = 1;
  const day_schedule: DailyRewardDaySlot[] = DAILY_REWARD_TEMPLATE.map((row) => ({
    ...row,
    status: claimedToday ? (row.day === 1 ? "claimed" : "locked") : row.day === 1 ? "claimable" : "locked",
  }));
  return {
    can_claim: !claimedToday,
    current_streak: claimedToday ? 1 : 0,
    max_streak: 3,
    last_claim_date: claimedToday ? new Date().toISOString().slice(0, 10) : null,
    streak_display: 1,
    next_reward_day: 1,
    day_slot: daySlot,
    reward_coins: 1_000,
    reward_crystals: 0,
    days_to_weekly_bonus: 7 - daySlot,
    weekly_bonus_crystals: 5,
    day_schedule,
    message: claimedToday ? "Награда уже получена сегодня. Загляните завтра!" : "",
  };
}

export async function fetchDailyRewardStatus(initData: string): Promise<DailyRewardStatus> {
  if (isLocalDevMock(initData)) {
    return buildMockDailyStatus(false);
  }
  return apiFetch("/api/daily-reward/", { initData }) as Promise<DailyRewardStatus>;
}

/** Забрать награду за сегодня (POST). */
export async function claimDailyReward(initData: string): Promise<DailyRewardStatus> {
  if (isLocalDevMock(initData)) {
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
  if (isLocalDevMock(initData)) {
    return { achievements: [], new_achievements: [] };
  }
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
  if (isLocalDevMock(initData)) {
    return [
      {
        id: 9001,
        name: "Крепкий старт",
        description: "Начиная каждый цикл с 5,000 осколков",
        upgrade_type: "start_boost",
        value: 5000,
        price_crystals: 3,
        max_level: 1,
      },
      {
        id: 9002,
        name: "Память мышц",
        description: "Стартовый апгрейд «Крепкие пальцы» (+1 к клику)",
        upgrade_type: "tap_bonus",
        value: 1,
        price_crystals: 5,
        max_level: 1,
      },
    ];
  }
  return apiFetch("/api/celestial-upgrades/", { initData }) as Promise<any>;
}

/** Для `isLocalDevMock`: результат покупки считается на клиенте (как в PrestigePanel). */
export type DevCelestialBuyPreview = {
  upgradeName: string;
  nextLevel: number;
  crystalsAfter: number;
};

export async function buyCelestialUpgrade(
  initData: string,
  upgradeId: number,
  devPreview?: DevCelestialBuyPreview,
): Promise<{
  success: boolean;
  upgrade_id: number;
  upgrade_name: string;
  new_level: number;
  crystals_left: number;
}> {
  if (isLocalDevMock(initData)) {
    if (!devPreview) {
      throw new Error("Local dev celestial buy requires DevCelestialBuyPreview");
    }
    return {
      success: true,
      upgrade_id: upgradeId,
      upgrade_name: devPreview.upgradeName,
      new_level: devPreview.nextLevel,
      crystals_left: devPreview.crystalsAfter,
    };
  }
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

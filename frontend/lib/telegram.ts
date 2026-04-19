export type TelegramWebAppLike = {
  ready: () => void;
  expand: () => void;
  openLink?: (url: string) => void;
  initData: string;
  initDataUnsafe: Record<string, unknown>;
  version: string;
  platform: string;
};

export function getTelegramWebApp(): TelegramWebAppLike | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Telegram?: { WebApp?: TelegramWebAppLike } }).Telegram
    ?.WebApp;
}

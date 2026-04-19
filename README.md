# Crypto Tap Mini App

Монорепозиторий: **Django REST Framework** (API, игроки, тапы, рефералы из `start_param`) и **Next.js** (Telegram Mini App, тапалка).

## Структура

- `backend/` — Django 5, приложение `tap`, SQLite по умолчанию.
- `frontend/` — Next.js (App Router), прокси `/api/*` → DRF в dev, если не задан `NEXT_PUBLIC_API_URL`.

## Быстрый старт

### 1. Бэкенд

```bash
cd backend
python -m venv ../.venv
../.venv/Scripts/pip install -r requirements.txt
copy .env.example .env
```

Укажите в `.env` **`TELEGRAM_BOT_TOKEN`** от [@BotFather](https://t.me/BotFather) — без него проверка `initData` не пройдёт.

Для **меню и клавиатуры в чате** задайте **`TELEGRAM_WEBAPP_URL`** — **HTTPS**-адрес фронта. В Telegram нельзя открыть Web App по `http://localhost`. В разработке удобнее всего **Cloudflare Tunnel** (`npm run tunnel` в `frontend` — см. ниже). Альтернатива: **Vercel** и публичный URL. Localtunnel (`npm run tunnel:lt`) — запасной вариант, для Telegram хуже (предупреждающая страница, 503/408).

```bash
../.venv/Scripts/python manage.py migrate
../.venv/Scripts/python manage.py runserver 0.0.0.0:8000
```

Отдельным процессом — **бот в режиме polling** (меню, `/start`, кнопки «Мост друзей», «Пульс»):

```bash
cd backend
../.venv/Scripts/python manage.py run_telegram_bot
```

### 2. Фронтенд

```bash
cd frontend
npm install
npm run dev
```

**Туннель Cloudflare (рекомендуется для Telegram):** установите [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/) (Windows: `winget install Cloudflare.cloudflared`). После установки **один раз** добавьте в **PATH** пользователя папку с `cloudflared.exe`, чаще всего `C:\Program Files (x86)\cloudflared`, и **откройте новый терминал** (или перезайдите в систему). Проверка: `cloudflared --version`. Затем из `frontend`, пока работает **`npm run dev`**, выполните **`npm run tunnel`**. В логе найдите **`https://….trycloudflare.com`** — укажите в **`TELEGRAM_WEBAPP_URL`** в `backend/.env` и в BotFather (дубликат в CORS подставляется из `settings.py`). При новом запуске quick tunnel URL обычно меняется. Перед новым туннелем завершите старый (**Ctrl+C**).

**Localtunnel (запасной вариант):** `npm run tunnel:lt` — в выводе смотрите `your url is:`. Часто нестабилен (503, 408, страница с IP), для Mini App в Telegram не рекомендуется.

**Деплой фронта на Vercel:** репозиторий подключите к [Vercel](https://vercel.com), **Root Directory** = `frontend`, Framework = Next.js. В переменных окружения задайте **`NEXT_PUBLIC_API_URL`** = публичный URL вашего Django (например тот же API на Railway/Render или отдельный домен). Локальный `127.0.0.1:8000` с телефона недоступен — API должен быть в интернете с CORS.

Если в Mini App **503 / 408**: сначала прогрейте страницу в браузере по тому же HTTPS, убедитесь, что **dev** и **туннель** запущены, затем обновите мини-приложение в Telegram.

Откройте [http://127.0.0.1:3000](http://127.0.0.1:3000) (dev слушает только этот адрес). Полноценная синхронизация с API возможна только внутри Telegram Mini App (есть заголовок `X-Telegram-Init-Data`).

### 3. Telegram

1. Запустите `run_telegram_bot` и задайте `TELEGRAM_WEBAPP_URL` — скрипт сам выставит **Menu Button** (Web App) через Bot API. Вручную то же можно в BotFather: **Bot Settings → Menu Button**.
2. Во фронте (`.env.local`) по желанию укажите **`NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`** — в мини-приложении появится копирование реферальной ссылки в профиле.
3. Ссылка с рефералом: `https://t.me/<your_bot>?startapp=ref_<TELEGRAM_ID>` — бэкенд читает `start_param` из `initData` и привязывает нового игрока к пригласившему.

## API

| Метод | Путь | Описание |
|--------|------|----------|
| GET | `/api/health/` | Проверка живости |
| GET | `/api/me/` | Профиль (заголовок `X-Telegram-Init-Data`) |
| POST | `/api/taps/sync/` | Тело: `{"taps_delta": N}` — добавить тапы и монеты |

Интеграция с вашей криптоплатформой: добавьте поля/эндпоинты (кошелёк, начисления токенов) в приложении `tap` или отдельном Django-приложении и вызывайте их из тех же view после проверки Telegram.

## Лицензия

Проект-скелет для внутренней разработки — задайте лицензию при публикации.

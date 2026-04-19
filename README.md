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

```bash
../.venv/Scripts/python manage.py migrate
../.venv/Scripts/python manage.py runserver 0.0.0.0:8000
```

### 2. Фронтенд

```bash
cd frontend
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000). Полноценная синхронизация с API возможна только внутри Telegram Mini App (есть заголовок `X-Telegram-Init-Data`).

### 3. Telegram

1. В BotFather: **Bot Settings → Menu Button** или настройте Web App URL на ваш HTTPS (например прод-домен или туннель вроде ngrok).
2. Ссылка с рефералом: `https://t.me/<your_bot>?startapp=ref_<TELEGRAM_ID>` — бэкенд читает `start_param` из `initData` и привязывает нового игрока к пригласившему.

## API

| Метод | Путь | Описание |
|--------|------|----------|
| GET | `/api/health/` | Проверка живости |
| GET | `/api/me/` | Профиль (заголовок `X-Telegram-Init-Data`) |
| POST | `/api/taps/sync/` | Тело: `{"taps_delta": N}` — добавить тапы и монеты |

Интеграция с вашей криптоплатформой: добавьте поля/эндпоинты (кошелёк, начисления токенов) в приложении `tap` или отдельном Django-приложении и вызывайте их из тех же view после проверки Telegram.

## Лицензия

Проект-скелет для внутренней разработки — задайте лицензию при публикации.

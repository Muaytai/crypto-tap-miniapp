import logging

from django.conf import settings
from django.core.management.base import BaseCommand
from telegram import (
    BotCommand,
    KeyboardButton,
    MenuButtonWebApp,
    ReplyKeyboardMarkup,
    Update,
    WebAppInfo,
)
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters

logger = logging.getLogger(__name__)

BTN_LAYER = "⚡ Игра POWERCXT"
BTN_PROFILE = "📊 Профиль"
BTN_TOP = "🏆 Рейтинг"
BTN_BRIDGE = "🎁 Пригласить"
BTN_PULSE = "✉️ Обратная связь"

WELCOME_HTML = """\
<b>POWERCXT</b>

Тапай, проходи этапы, копи монеты. Счёт в Telegram синхронизируется с сервером.

<b>Как зайти в игру:</b> синяя кнопка <code>⚡ POWERCXT</code> у поля ввода или кнопки ниже — откроется мини-приложение.

<i>«Пригласить» — реферальная ссылка, «Обратная связь» — напишите нам.</i>
"""


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return
    web_url = settings.TELEGRAM_WEBAPP_URL
    if not web_url:
        await update.message.reply_text(
            "Укажите TELEGRAM_WEBAPP_URL в .env — HTTPS-адрес фронта (туннель или хостинг)."
        )
        return
    web_url = web_url.rstrip("/")
    keyboard = ReplyKeyboardMarkup(
        [
            [KeyboardButton(BTN_LAYER, web_app=WebAppInfo(url=web_url))],
            [
                KeyboardButton(
                    BTN_PROFILE,
                    web_app=WebAppInfo(url=f"{web_url}/#profile"),
                ),
            ],
            [KeyboardButton(BTN_TOP), KeyboardButton(BTN_BRIDGE)],
            [KeyboardButton(BTN_PULSE)],
        ],
        resize_keyboard=True,
        is_persistent=True,
        input_field_placeholder="POWERCXT…",
    )
    await update.message.reply_html(WELCOME_HTML, reply_markup=keyboard)


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message:
        await update.message.reply_html(
            "<b>Как играть</b>\n\n"
            "Откройте игру через меню или кнопку <code>⚡ Игра POWERCXT</code>. "
            "Внутри — этапы и финал; тапы сохраняются на сервере.\n\n"
            "<code>/start</code> — обновить клавиатуру."
        )


async def on_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.message.text:
        return
    text = update.message.text.strip()
    bot = context.bot
    uid = update.effective_user.id if update.effective_user else 0

    if text == BTN_TOP:
        await update.message.reply_text(
            "🏆 Таблица лидеров появится на сервере позже.\n"
            "Пока загляните в раздел «Топ» в мини-приложении."
        )
        return
    if text == BTN_BRIDGE:
        me = await bot.get_me()
        un = me.username
        if not un:
            await update.message.reply_text(
                "У бота нет @username — задайте имя пользователя в BotFather."
            )
            return
        link = f"https://t.me/{un}?startapp=ref_{uid}"
        await update.message.reply_html(
            "🎁 <b>Пригласить друзей</b>\n\n"
            "Отправьте ссылку — друг зайдёт в игру, реферал сохранится на сервере:\n\n"
            f"<code>{link}</code>",
        )
        return
    if text == BTN_PULSE:
        await update.message.reply_html(
            "✉️ <b>Обратная связь</b>\n\n"
            "Ответьте на это сообщение с идеей или багом — мы читаем чат бота.\n"
            "Срочное: укажите @username в настройках Telegram.",
        )
        return


async def post_init(application: Application) -> None:
    web_url = settings.TELEGRAM_WEBAPP_URL
    if not web_url:
        logger.warning("TELEGRAM_WEBAPP_URL пуст — кнопка меню Web App не установлена.")
        return
    web_url = web_url.rstrip("/")
    await application.bot.set_my_commands(
        [
            BotCommand("start", "Панель POWERCXT"),
            BotCommand("help", "Как играть"),
        ]
    )
    try:
        await application.bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(
                text="⚡ POWERCXT",
                web_app=WebAppInfo(url=web_url),
            )
        )
    except Exception as e:
        logger.warning("set_chat_menu_button: %s", e)


class Command(BaseCommand):
    help = "Telegram-бот (polling): reply-клавиатура, кнопка меню Mini App, /start"

    def handle(self, *args, **options):
        logging.basicConfig(
            format="%(asctime)s %(levelname)s %(name)s %(message)s",
            level=logging.INFO,
        )
        token = settings.TELEGRAM_BOT_TOKEN
        if not token:
            self.stderr.write(self.style.ERROR("TELEGRAM_BOT_TOKEN не задан в .env"))
            return
        if not settings.TELEGRAM_WEBAPP_URL:
            self.stderr.write(
                self.style.WARNING(
                    "TELEGRAM_WEBAPP_URL пуст — Web App кнопки не сработают. "
                    "Укажите HTTPS URL (например https://xxxx.ngrok-free.app)."
                )
            )

        application = Application.builder().token(token).post_init(post_init).build()
        application.add_handler(CommandHandler("start", cmd_start))
        application.add_handler(CommandHandler("help", cmd_help))
        application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, on_text))
        self.stdout.write(self.style.SUCCESS("Бот запущен (polling). Ctrl+C — выход."))
        application.run_polling(drop_pending_updates=True, allowed_updates=Update.ALL_TYPES)

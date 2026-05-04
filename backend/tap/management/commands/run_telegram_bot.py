"""
Бот для Mini App. В референсе «Капля Руперта» до игры часто стоят:
  подписка на канал (getChatMember) + кнопка «Я подписался», /privacy со ссылкой.

Здесь: /start, /help, /invite и Menu Button → Web App. Чтобы повторить «стену»:
  - в обработчике /start слать InlineKeyboard: url «Подписаться» + callback «Я подписался»;
  - по callback вызывать bot.get_chat_member(channel_id, user_id) и при member не в left/kicked
    разрешать играть (флаг в БД или просто текст «можно открыть мини-апп»);
  - команду /privacy и ссылку на политику — по аналогии с референсом.
"""
import logging

from django.conf import settings
from django.core.management.base import BaseCommand
from telegram import BotCommand, MenuButtonWebApp, ReplyKeyboardRemove, Update, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes

logger = logging.getLogger(__name__)

WELCOME_HTML = """\
<b>POWERCXT</b>

Тапай, проходи этапы, копи монеты. Счёт в Telegram синхронизируется с сервером.

<b>Как зайти:</b> нажмите синюю кнопку <code>⚡ POWERCXT</code> слева от поля ввода — откроется мини-приложение (игра, профиль и топ внутри).

<code>/invite</code> — реферальная ссылка. Об идеях и багах можно написать в этот чат.
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
    await update.message.reply_html(
        WELCOME_HTML,
        reply_markup=ReplyKeyboardRemove(),
    )


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message:
        await update.message.reply_html(
            "<b>Как играть</b>\n\n"
            "Откройте мини-приложение синей кнопкой <code>⚡ POWERCXT</code> у поля ввода. "
            "Внутри — этапы, профиль и рейтинг; тапы сохраняются на сервере.\n\n"
            "<code>/start</code> — приветствие.\n"
            "<code>/invite</code> — ссылка для приглашения друзей."
        )


async def cmd_invite(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return
    bot = context.bot
    uid = update.effective_user.id if update.effective_user else 0
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


async def post_init(application: Application) -> None:
    web_url = settings.TELEGRAM_WEBAPP_URL
    if not web_url:
        logger.warning("TELEGRAM_WEBAPP_URL пуст — кнопка меню Web App не установлена.")
        return
    web_url = web_url.rstrip("/")
    await application.bot.set_my_commands(
        [
            BotCommand("start", "POWERCXT"),
            BotCommand("help", "Как играть"),
            BotCommand("invite", "Пригласить друзей"),
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
    help = "Telegram-бот (polling): кнопка меню Mini App, /start, без reply-клавиатуры"

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
        application.add_handler(CommandHandler("invite", cmd_invite))
        self.stdout.write(self.style.SUCCESS("Бот запущен (polling). Ctrl+C — выход."))
        application.run_polling(drop_pending_updates=True, allowed_updates=Update.ALL_TYPES)

"""Один запрос к Bot API: кнопка меню Web App = TELEGRAM_WEBAPP_URL из .env."""

import json
import urllib.error
import urllib.request

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = (
        "Обновить у бота кнопку меню Mini App по TELEGRAM_WEBAPP_URL "
        "(если сменили туннель и в Telegram всё ещё старый trycloudflare.com)."
    )

    def handle(self, *args, **options):
        token = settings.TELEGRAM_BOT_TOKEN
        web_url = (settings.TELEGRAM_WEBAPP_URL or "").rstrip("/")
        if not token:
            raise CommandError("TELEGRAM_BOT_TOKEN не задан в .env")
        if not web_url:
            raise CommandError("TELEGRAM_WEBAPP_URL не задан в .env")

        body = json.dumps(
            {
                "menu_button": {
                    "type": "web_app",
                    "text": "⚡ POWERCXT",
                    "web_app": {"url": web_url},
                }
            }
        ).encode("utf-8")
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{token}/setChatMenuButton",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                raw = resp.read().decode()
        except urllib.error.HTTPError as e:
            raise CommandError(e.read().decode()) from e

        data = json.loads(raw)
        if not data.get("ok"):
            raise CommandError(str(data))
        self.stdout.write(self.style.SUCCESS(f"Menu button OK: {web_url}"))

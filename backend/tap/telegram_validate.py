import hashlib
import hmac
import json
import time
from urllib.parse import parse_qsl

from django.conf import settings


def _build_data_check_string(pairs: list[tuple[str, str]]) -> str:
    # Telegram: sort by key, exclude hash, format key=value joined by \n
    filtered = [(k, v) for k, v in pairs if k != "hash"]
    filtered.sort(key=lambda x: x[0])
    return "\n".join(f"{k}={v}" for k, v in filtered)


def validate_init_data(init_data: str, max_age_seconds: int = 86400) -> dict[str, str]:
    """
    Validates Telegram Web App initData per
    https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
    """
    if not settings.TELEGRAM_BOT_TOKEN:
        raise ValueError("TELEGRAM_BOT_TOKEN is not configured")

    pairs = parse_qsl(init_data, keep_blank_values=True, strict_parsing=False)
    data = dict(pairs)
    received_hash = data.get("hash")
    if not received_hash:
        raise ValueError("hash missing")

    auth_date = data.get("auth_date")
    if auth_date:
        ts = int(auth_date)
        if time.time() - ts > max_age_seconds:
            raise ValueError("initData expired")

    check_string = _build_data_check_string(pairs)
    secret_key = hmac.new(
        b"WebAppData", settings.TELEGRAM_BOT_TOKEN.encode(), hashlib.sha256
    ).digest()
    computed = hmac.new(secret_key, check_string.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(computed, received_hash):
        raise ValueError("invalid initData signature")

    return data


def parse_user_json(user_raw: str) -> dict:
    return json.loads(user_raw)


def parse_start_param(init_data: dict[str, str]) -> str | None:
    return init_data.get("start_param") or None

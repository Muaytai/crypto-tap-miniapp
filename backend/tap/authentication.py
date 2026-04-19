import json
from dataclasses import dataclass

from rest_framework import authentication, exceptions

from .models import Player
from .telegram_validate import parse_start_param, parse_user_json, validate_init_data


@dataclass
class TelegramPrincipal:
    player: Player
    init_data: dict[str, str]

    @property
    def is_authenticated(self) -> bool:
        return True


class TelegramMiniAppAuthentication(authentication.BaseAuthentication):
    header_name = "HTTP_X_TELEGRAM_INIT_DATA"

    def authenticate(self, request):
        raw = request.META.get(self.header_name)
        if not raw:
            return None

        try:
            data = validate_init_data(raw)
        except ValueError as e:
            raise exceptions.AuthenticationFailed(str(e)) from e

        user_raw = data.get("user")
        if not user_raw:
            raise exceptions.AuthenticationFailed("user field missing in initData")

        try:
            tg_user = parse_user_json(user_raw)
        except json.JSONDecodeError as e:
            raise exceptions.AuthenticationFailed("invalid user json") from e

        telegram_id = tg_user.get("id")
        if not telegram_id:
            raise exceptions.AuthenticationFailed("telegram user id missing")

        start_param = parse_start_param(data)
        referrer = None
        if start_param and start_param.startswith("ref_"):
            try:
                ref_id = int(start_param.removeprefix("ref_"))
                if ref_id != telegram_id:
                    referrer = Player.objects.filter(telegram_id=ref_id).first()
            except ValueError:
                referrer = None

        defaults = {
            "username": tg_user.get("username") or "",
            "first_name": tg_user.get("first_name") or "",
        }

        player, created = Player.objects.get_or_create(
            telegram_id=telegram_id,
            defaults=defaults,
        )
        if not created:
            Player.objects.filter(pk=player.pk).update(**defaults)

        if created and referrer:
            Player.objects.filter(pk=player.pk).update(referred_by=referrer)

        principal = TelegramPrincipal(player=player, init_data=data)
        return (principal, None)

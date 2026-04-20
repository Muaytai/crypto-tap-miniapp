from django.conf import settings
from django.db.models import F
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import TelegramMiniAppAuthentication, TelegramPrincipal
from .models import Player
from .serializers import PlayerSerializer, TapSyncSerializer


class HealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({"status": "ok"})


class PublicConfigView(APIView):
    """Публичные настройки для фронта (без секретов)."""

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response(
            {
                "telegram_bot_username": settings.TELEGRAM_BOT_USERNAME or "",
            }
        )


class MeView(APIView):
    authentication_classes = [TelegramMiniAppAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        principal: TelegramPrincipal = request.user
        return Response(PlayerSerializer(principal.player).data)


class TapSyncView(APIView):
    authentication_classes = [TelegramMiniAppAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TapSyncSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        delta = serializer.validated_data["taps_delta"]
        principal: TelegramPrincipal = request.user
        player = principal.player

        Player.objects.filter(pk=player.pk).update(
            total_taps=F("total_taps") + delta,
            coins=F("coins") + delta,
        )
        player.refresh_from_db()
        return Response(PlayerSerializer(player).data)


class LeaderboardView(APIView):
    """Топ игроков; при заголовке X-Telegram-Init-Data — добавляются me и me_rank."""

    authentication_classes = [TelegramMiniAppAuthentication]
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            limit = int(request.query_params.get("limit", 20))
        except (TypeError, ValueError):
            limit = 20
        limit = max(1, min(limit, 100))

        qs = list(Player.objects.order_by("-total_taps", "telegram_id")[:limit])
        results = [
            {
                "rank": i + 1,
                "telegram_id": p.telegram_id,
                "first_name": p.first_name,
                "username": p.username,
                "photo_url": p.photo_url or "",
                "total_taps": p.total_taps,
                "coins": p.coins,
            }
            for i, p in enumerate(qs)
        ]

        payload: dict = {"results": results}
        user = request.user
        if isinstance(user, TelegramPrincipal):
            player = user.player
            ahead = Player.objects.filter(total_taps__gt=player.total_taps).count()
            same_before = Player.objects.filter(
                total_taps=player.total_taps, telegram_id__lt=player.telegram_id
            ).count()
            payload["me_rank"] = ahead + same_before + 1
            payload["me"] = PlayerSerializer(player).data

        return Response(payload)

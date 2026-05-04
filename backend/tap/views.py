from django.conf import settings
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import TelegramMiniAppAuthentication, TelegramPrincipal
from .models import Player, Item, PlayerItem, Upgrade, PlayerUpgrade
from .serializers import (
    PlayerSerializer, TapSyncSerializer, FullStateSerializer,
    BuyItemSerializer, BuyUpgradeSerializer, ItemSerializer, UpgradeSerializer
)


class HealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({"status": "ok"})


class PublicConfigView(APIView):
    """Публичные настройки для фронта (без секретов)"""
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
        player = principal.player

        # Начисляем оффлайн доход
        player.claim_offline_income()
        player.refresh_from_db()

        return Response(PlayerSerializer(player).data)


class TapSyncView(APIView):
    authentication_classes = [TelegramMiniAppAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TapSyncSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        taps_delta = serializer.validated_data["taps_delta"]
        coins_delta = serializer.validated_data.get("coins_delta", 0)

        principal: TelegramPrincipal = request.user
        player = principal.player

        # Сначала начисляем оффлайн доход
        player.claim_offline_income()

        # Потом добавляем тапы и монеты от клиента
        with transaction.atomic():
            Player.objects.filter(pk=player.pk).update(
                total_taps=F("total_taps") + taps_delta,
                coins=F("coins") + taps_delta + coins_delta,
                total_earned_all_time=F("total_earned_all_time") + taps_delta + coins_delta,
                last_sync_at=timezone.now(),
            )
            player.refresh_from_db()

        # Пересчитываем income_per_second (просто для ответа)
        income_per_second = 0
        player_items = PlayerItem.objects.filter(player=player).select_related("item")
        for pi in player_items:
            income_per_second += pi.quantity * pi.item.base_income_per_second

        return Response({
            "player": PlayerSerializer(player).data,
            "income_per_second": income_per_second,
        })


class FullStateView(APIView):
    """Полное состояние игры (баланс, предметы, улучшения, доход/сек)"""
    authentication_classes = [TelegramMiniAppAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        principal: TelegramPrincipal = request.user
        player = principal.player

        # Начисляем оффлайн доход перед выдачей состояния
        player.claim_offline_income()
        player.refresh_from_db()

        # Собираем данные
        player_items = PlayerItem.objects.filter(player=player).select_related("item")
        player_upgrades = PlayerUpgrade.objects.filter(player=player).select_related("upgrade")
        available_items = Item.objects.filter(is_active=True)
        available_upgrades = Upgrade.objects.filter(is_active=True)

        # Считаем текущий доход/сек
        income_per_second = 0
        for pi in player_items:
            income_per_second += pi.quantity * pi.item.base_income_per_second

        data = {
            "player": player,
            "items": player_items,
            "upgrades": player_upgrades,
            "available_items": available_items,
            "available_upgrades": available_upgrades,
            "income_per_second": income_per_second,
        }
        serializer = FullStateSerializer(data)
        return Response(serializer.data)


class BuyItemView(APIView):
    """Покупка предметов в магазине"""
    authentication_classes = [TelegramMiniAppAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BuyItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        item_id = serializer.validated_data["item_id"]
        quantity = serializer.validated_data["quantity"]

        principal: TelegramPrincipal = request.user
        player = principal.player

        try:
            item = Item.objects.get(id=item_id, is_active=True)
        except Item.DoesNotExist:
            return Response({"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND)

        # Получаем текущее количество предмета у игрока
        player_item, created = PlayerItem.objects.get_or_create(
            player=player,
            item=item,
            defaults={"quantity": 0}
        )

        # Считаем общую стоимость
        total_price = item.get_price_for_quantity(player_item.quantity, quantity)

        # Проверяем, хватает ли монет
        if player.coins < total_price:
            return Response(
                {"error": f"Not enough coins. Need {total_price}, have {player.coins}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проводим транзакцию
        with transaction.atomic():
            player.coins -= total_price
            player.save(update_fields=["coins"])

            player_item.quantity += quantity
            player_item.save()

        # Пересчитываем кэш дохода
        player.refresh_from_db()
        player.cached_income_per_second = 0
        all_items = PlayerItem.objects.filter(player=player).select_related("item")
        for pi in all_items:
            player.cached_income_per_second += pi.quantity * pi.item.base_income_per_second
        player.save(update_fields=["cached_income_per_second"])

        return Response({
            "success": True,
            "item_id": item.id,
            "new_quantity": player_item.quantity,
            "coins_left": player.coins,
            "cached_income_per_second": player.cached_income_per_second,
        })


class BuyUpgradeView(APIView):
    """Покупка улучшений"""
    authentication_classes = [TelegramMiniAppAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BuyUpgradeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        upgrade_id = serializer.validated_data["upgrade_id"]

        principal: TelegramPrincipal = request.user
        player = principal.player

        try:
            upgrade = Upgrade.objects.get(id=upgrade_id, is_active=True)
        except Upgrade.DoesNotExist:
            return Response({"error": "Upgrade not found"}, status=status.HTTP_404_NOT_FOUND)

        # Проверяем, не куплено ли уже
        if PlayerUpgrade.objects.filter(player=player, upgrade=upgrade).exists():
            return Response({"error": "Upgrade already purchased"}, status=status.HTTP_400_BAD_REQUEST)

        # Проверяем условия открытия
        if player.total_taps < upgrade.min_total_taps:
            return Response({"error": f"Need {upgrade.min_total_taps} taps"}, status=status.HTTP_400_BAD_REQUEST)

        if player.prestige_count < upgrade.min_prestige_count:
            return Response({"error": f"Need {upgrade.min_prestige_count} prestiges"},
                            status=status.HTTP_400_BAD_REQUEST)

        if upgrade.required_item:
            try:
                player_item = PlayerItem.objects.get(player=player, item=upgrade.required_item)
                if player_item.quantity < upgrade.required_item_quantity:
                    return Response({"error": f"Need {upgrade.required_item_quantity} of {upgrade.required_item.name}"},
                                    status=status.HTTP_400_BAD_REQUEST)
            except PlayerItem.DoesNotExist:
                return Response({"error": f"Need {upgrade.required_item_quantity} of {upgrade.required_item.name}"},
                                status=status.HTTP_400_BAD_REQUEST)

        # Проверяем деньги
        if player.coins < upgrade.base_price:
            return Response({"error": f"Not enough coins. Need {upgrade.base_price}"},
                            status=status.HTTP_400_BAD_REQUEST)

        # Покупаем
        with transaction.atomic():
            player.coins -= upgrade.base_price
            player.save(update_fields=["coins"])

            PlayerUpgrade.objects.create(player=player, upgrade=upgrade)

            # Применяем эффект улучшения
            if upgrade.upgrade_type == "offline_extension":
                player.max_offline_minutes += int(upgrade.value)
                player.save(update_fields=["max_offline_minutes"])

        return Response({
            "success": True,
            "upgrade_id": upgrade.id,
            "upgrade_name": upgrade.name,
            "coins_left": player.coins,
            "max_offline_minutes": player.max_offline_minutes,
        })


class LeaderboardView(APIView):
    """Топ игроков"""
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


# ВРЕМЕННЫЙ ТЕСТОВЫЙ ЭНДПОИНТ (только для разработки)
class TestAuthView(APIView):
    """Тестовый эндпоинт для создания фейкового игрока (только для разработки)"""
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        telegram_id = request.GET.get("telegram_id", 123456789)
        username = request.GET.get("username", "test_user")

        player, created = Player.objects.get_or_create(
            telegram_id=telegram_id,
            defaults={
                "username": username,
                "first_name": "Test",
                "coins": 10000,  # стартовый баланс для тестов
                "total_taps": 0,
            }
        )

        # Обновляем cached_income_per_second для теста
        if created:
            player.cached_income_per_second = 0
            player.save()

        return Response({
            "created": created,
            "player": PlayerSerializer(player).data,
            "message": f"Игрок {'создан' if created else 'уже существует'} (ID: {player.telegram_id})"
        })
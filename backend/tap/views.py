from django.conf import settings
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import TelegramMiniAppAuthentication, TelegramPrincipal
from .models import (
    Player, Item, PlayerItem, Upgrade, PlayerUpgrade,
    CelestialUpgrade, PlayerCelestialUpgrade,
    Achievement, PlayerAchievement,
    DailyRewardConfig, PlayerDailyReward
)
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

        # Получаем множитель кликов из улучшений игрока
        click_multiplier = 1.0
        player_upgrades = PlayerUpgrade.objects.filter(
            player=player,
            upgrade__upgrade_type="click_multiplier"
        ).select_related("upgrade")

        for pu in player_upgrades:
            click_multiplier *= pu.upgrade.value

        # Считаем монеты от тапов с множителем
        coins_from_taps = int(taps_delta * click_multiplier)

        # Потом добавляем тапы и монеты от клиента
        with transaction.atomic():
            Player.objects.filter(pk=player.pk).update(
                total_taps=F("total_taps") + taps_delta,
                coins=F("coins") + coins_from_taps + coins_delta,
                total_earned_all_time=F("total_earned_all_time") + coins_from_taps + coins_delta,
                last_sync_at=timezone.now(),
            )
            player.refresh_from_db()

        # Пересчитываем income_per_second (просто для ответа)
        income_per_second = player.recalculate_income_per_second()

        return Response({
            "player": PlayerSerializer(player).data,
            "income_per_second": income_per_second,
            "click_multiplier": click_multiplier,
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

        # Считаем текущий доход/сек через метод модели
        income_per_second = player.recalculate_income_per_second()

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

        # Пересчитываем кэш дохода через метод модели
        player.recalculate_income_per_second()
        player.refresh_from_db()

        return Response({
            "success": True,
            "item_id": item.id,
            "item_name": item.name,
            "quantity_bought": quantity,
            "new_quantity": player_item.quantity,
            "total_price": total_price,
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
            return Response(
                {"error": f"Need {upgrade.min_total_taps} taps, you have {player.total_taps}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if player.prestige_count < upgrade.min_prestige_count:
            return Response(
                {"error": f"Need {upgrade.min_prestige_count} prestiges, you have {player.prestige_count}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if upgrade.required_item:
            try:
                player_item = PlayerItem.objects.get(player=player, item=upgrade.required_item)
                if player_item.quantity < upgrade.required_item_quantity:
                    return Response(
                        {"error": f"Need {upgrade.required_item_quantity} of {upgrade.required_item.name}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except PlayerItem.DoesNotExist:
                return Response(
                    {"error": f"Need {upgrade.required_item_quantity} of {upgrade.required_item.name}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Проверяем деньги
        if player.coins < upgrade.base_price:
            return Response(
                {"error": f"Not enough coins. Need {upgrade.base_price}, have {player.coins}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Покупаем
        with transaction.atomic():
            player.coins -= upgrade.base_price
            player.save(update_fields=["coins"])

            PlayerUpgrade.objects.create(player=player, upgrade=upgrade)

            # Применяем эффект улучшения
            if upgrade.upgrade_type == "offline_extension":
                player.max_offline_minutes += int(upgrade.value)
                player.save(update_fields=["max_offline_minutes"])

            # Если улучшение влияет на доход или клики — пересчитываем кэш
            if upgrade.upgrade_type in ["income_multiplier", "click_multiplier"]:
                player.recalculate_income_per_second()

        return Response({
            "success": True,
            "upgrade_id": upgrade.id,
            "upgrade_name": upgrade.name,
            "upgrade_type": upgrade.upgrade_type,
            "coins_left": player.coins,
            "max_offline_minutes": player.max_offline_minutes,
            "cached_income_per_second": player.cached_income_per_second,
        })


class PrestigeView(APIView):
    """Закалка (престиж) — сброс прогресса с выдачей алмазов"""
    authentication_classes = [TelegramMiniAppAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        principal: TelegramPrincipal = request.user
        player = principal.player

        # Начисляем оффлайн доход перед закалкой
        player.claim_offline_income()
        player.refresh_from_db()

        result = player.perform_prestige()

        if not result["success"]:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        return Response(result)

    def get(self, request):
        """Проверка, может ли игрок сделать закалку"""
        principal: TelegramPrincipal = request.user
        player = principal.player

        return Response({
            "can_prestige": player.can_prestige(),
            "total_earned_all_time": player.total_earned_all_time,
            "prestige_threshold": 500_000_000_000,
            "current_prestige_count": player.prestige_count,
            "crystals": player.crystals,
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


# ========== НЕБЕСНЫЕ АПГРЕЙДЫ ==========

class CelestialUpgradeListView(APIView):
    """Список доступных небесных апгрейдов"""
    authentication_classes = [TelegramMiniAppAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        upgrades = CelestialUpgrade.objects.filter(is_active=True)
        return Response([{
            "id": u.id,
            "name": u.name,
            "description": u.description,
            "upgrade_type": u.upgrade_type,
            "value": u.value,
            "price_crystals": u.price_crystals,
            "max_level": u.max_level,
        } for u in upgrades])


class BuyCelestialUpgradeView(APIView):
    """Покупка/прокачка небесного апгрейда за алмазы"""
    authentication_classes = [TelegramMiniAppAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        upgrade_id = request.data.get("upgrade_id")

        try:
            upgrade = CelestialUpgrade.objects.get(id=upgrade_id, is_active=True)
        except CelestialUpgrade.DoesNotExist:
            return Response({"error": "Upgrade not found"}, status=404)

        principal: TelegramPrincipal = request.user
        player = principal.player

        player_upgrade, created = PlayerCelestialUpgrade.objects.get_or_create(
            player=player,
            upgrade=upgrade,
            defaults={"level": 1}
        )

        if not created and player_upgrade.level >= upgrade.max_level:
            return Response({"error": "Max level reached"}, status=400)

        next_level = player_upgrade.level + 1 if not created else 1
        price = upgrade.price_crystals * next_level  # цена растёт с уровнем

        if player.crystals < price:
            return Response({"error": f"Need {price} crystals"}, status=400)

        with transaction.atomic():
            player.crystals -= price
            player.save()

            if created:
                player_upgrade.level = 1
            else:
                player_upgrade.level += 1
            player_upgrade.save()

        return Response({
            "success": True,
            "upgrade_id": upgrade.id,
            "upgrade_name": upgrade.name,
            "new_level": player_upgrade.level,
            "crystals_left": player.crystals,
        })


# ========== ДОСТИЖЕНИЯ ==========

class AchievementsView(APIView):
    """Список достижений и прогресс игрока"""
    authentication_classes = [TelegramMiniAppAuthentication]
    permission_classes = [IsAuthenticated]

    @staticmethod
    def check_and_award_achievements(player):
        """Проверяет достижения и выдаёт награды"""
        earned_achievements = set(pa.achievement_id for pa in PlayerAchievement.objects.filter(player=player))

        # Данные для проверки
        total_items_bought = sum(pi.quantity for pi in PlayerItem.objects.filter(player=player))

        stats = {
            "total_taps": player.total_taps,
            "total_coins_earned": player.total_earned_all_time,
            "prestige_count": player.prestige_count,
            "items_bought": total_items_bought,
            "crystals_spent": 0,  # TODO: добавить поле в Player
        }

        new_achievements = []
        for ach in Achievement.objects.filter(is_active=True):
            if ach.id in earned_achievements:
                continue

            current_value = stats.get(ach.trigger_type, 0)
            if current_value >= ach.trigger_value:
                # Награждаем
                if ach.reward_crystals > 0:
                    player.crystals += ach.reward_crystals
                if ach.reward_coins > 0:
                    player.coins += ach.reward_coins

                PlayerAchievement.objects.create(player=player, achievement=ach)
                new_achievements.append({
                    "id": ach.id,
                    "name": ach.name,
                    "reward_crystals": ach.reward_crystals,
                    "reward_coins": ach.reward_coins,
                })
                player.save()

        return new_achievements

    def get(self, request):
        principal: TelegramPrincipal = request.user
        player = principal.player

        # Проверяем новые достижения
        new_achievements = self.check_and_award_achievements(player)

        # Собираем все достижения с прогрессом
        earned_ids = set(pa.achievement_id for pa in PlayerAchievement.objects.filter(player=player))

        all_achievements = []
        for ach in Achievement.objects.filter(is_active=True):
            all_achievements.append({
                "id": ach.id,
                "name": ach.name,
                "description": ach.description,
                "trigger_type": ach.trigger_type,
                "trigger_value": ach.trigger_value,
                "reward_crystals": ach.reward_crystals,
                "reward_coins": ach.reward_coins,
                "is_earned": ach.id in earned_ids,
            })

        return Response({
            "achievements": all_achievements,
            "new_achievements": new_achievements,
        })


# ========== ЕЖЕДНЕВНЫЕ НАГРАДЫ ==========

class DailyRewardView(APIView):
    """Получение ежедневной награды"""
    authentication_classes = [TelegramMiniAppAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from datetime import date

        principal: TelegramPrincipal = request.user
        player = principal.player

        daily, created = PlayerDailyReward.objects.get_or_create(
            player=player,
            defaults={
                "last_claim_date": None,
                "current_streak": 0,
                "max_streak": 0,
            }
        )

        today = date.today()
        can_claim = True
        message = ""
        reward_coins = 0
        reward_crystals = 0

        if daily.last_claim_date == today:
            can_claim = False
            message = "Already claimed today"
        elif daily.last_claim_date and (today - daily.last_claim_date).days > 1:
            # Пропуск → сброс серии
            daily.current_streak = 1
        else:
            daily.current_streak += 1

        if can_claim:
            # Получаем награду за текущий день
            try:
                reward_config = DailyRewardConfig.objects.get(day_number=daily.current_streak, is_active=True)
            except DailyRewardConfig.DoesNotExist:
                reward_config = DailyRewardConfig.objects.filter(is_active=True).first()

            if reward_config:
                reward_coins = reward_config.reward_coins
                reward_crystals = reward_config.reward_crystals

                with transaction.atomic():
                    player.coins += reward_coins
                    player.crystals += reward_crystals
                    player.save()

                    daily.last_claim_date = today
                    if daily.current_streak > daily.max_streak:
                        daily.max_streak = daily.current_streak
                    daily.save()

            message = f"Claimed day {daily.current_streak}! +{reward_coins} coins"

        return Response({
            "can_claim": can_claim,
            "current_streak": daily.current_streak,
            "max_streak": daily.max_streak,
            "last_claim_date": daily.last_claim_date,
            "reward_coins": reward_coins,
            "reward_crystals": reward_crystals,
            "message": message,
        })














# ========== ВРЕМЕННЫЕ ТЕСТОВЫЕ ЭНДПОИНТЫ (ТОЛЬКО ДЛЯ РАЗРАБОТКИ) ==========
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
                "coins": 10000,
                "total_taps": 0,
            }
        )

        if created:
            player.recalculate_income_per_second()

        return Response({
            "created": created,
            "player": PlayerSerializer(player).data,
            "message": f"Игрок {'создан' if created else 'уже существует'} (ID: {player.telegram_id})"
        })


class TestBuyView(APIView):
    """Тестовый эндпоинт для покупки через GET (только для разработки)"""
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        telegram_id = request.GET.get("telegram_id", 777)
        item_id = int(request.GET.get("item_id", 1))
        quantity = int(request.GET.get("quantity", 1))

        try:
            player = Player.objects.get(telegram_id=telegram_id)
            item = Item.objects.get(id=item_id, is_active=True)

            player_item, created = PlayerItem.objects.get_or_create(
                player=player,
                item=item,
                defaults={"quantity": 0}
            )

            total_price = item.get_price_for_quantity(player_item.quantity, quantity)

            if player.coins < total_price:
                return Response({"error": f"Not enough coins. Need {total_price}"})

            with transaction.atomic():
                player.coins -= total_price
                player.save()

                player_item.quantity += quantity
                player_item.save()

            player.recalculate_income_per_second()

            return Response({
                "success": True,
                "item": item.name,
                "quantity": quantity,
                "total_price": total_price,
                "coins_left": player.coins,
                "new_total_quantity": player_item.quantity,
                "income_per_second": player.cached_income_per_second,
            })
        except Exception as e:
            return Response({"error": str(e)})


class TestBuyUpgradeView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        telegram_id = request.GET.get("telegram_id", 777)
        upgrade_id = int(request.GET.get("upgrade_id", 1))

        try:
            player = Player.objects.get(telegram_id=telegram_id)
            upgrade = Upgrade.objects.get(id=upgrade_id, is_active=True)

            if PlayerUpgrade.objects.filter(player=player, upgrade=upgrade).exists():
                return Response({"error": "Already purchased"})

            if player.coins < upgrade.base_price:
                return Response({"error": f"Need {upgrade.base_price} coins"})

            with transaction.atomic():
                player.coins -= upgrade.base_price
                player.save()
                PlayerUpgrade.objects.create(player=player, upgrade=upgrade)

                if upgrade.upgrade_type in ["income_multiplier", "click_multiplier"]:
                    player.recalculate_income_per_second()

            return Response({
                "success": True,
                "upgrade": upgrade.name,
                "upgrade_type": upgrade.upgrade_type,
                "value": upgrade.value,
                "coins_left": player.coins,
            })
        except Exception as e:
            return Response({"error": str(e)})


class TestStateView(APIView):
    """Тестовый эндпоинт для получения state без авторизации"""
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        telegram_id = request.GET.get("telegram_id", 777)
        try:
            player = Player.objects.get(telegram_id=telegram_id)
            player.claim_offline_income()

            player_items = PlayerItem.objects.filter(player=player).select_related("item")
            player_upgrades = PlayerUpgrade.objects.filter(player=player).select_related("upgrade")
            available_items = Item.objects.filter(is_active=True)
            available_upgrades = Upgrade.objects.filter(is_active=True)
            income_per_second = player.recalculate_income_per_second()

            return Response({
                "player": PlayerSerializer(player).data,
                "items": [{"item_id": pi.item_id, "item_name": pi.item.name, "quantity": pi.quantity} for pi in
                          player_items],
                "upgrades": [{"upgrade_id": pu.upgrade_id, "upgrade_name": pu.upgrade.name} for pu in player_upgrades],
                "available_items": [{"id": i.id, "name": i.name, "base_price": i.base_price} for i in available_items],
                "available_upgrades": [{"id": u.id, "name": u.name, "base_price": u.base_price, "type": u.upgrade_type}
                                       for u in available_upgrades],
                "income_per_second": income_per_second,
            })
        except Player.DoesNotExist:
            return Response({"error": "Player not found"}, status=404)


class TestPrestigeView(APIView):
    """Тестовый эндпоинт для закалки без авторизации"""
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        telegram_id = request.GET.get("telegram_id", 777)
        try:
            player = Player.objects.get(telegram_id=telegram_id)
            player.claim_offline_income()

            result = player.perform_prestige()
            return Response(result)
        except Player.DoesNotExist:
            return Response({"error": "Player not found"}, status=404)


class TestAchievementsView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        telegram_id = request.GET.get("telegram_id", 777)
        try:
            player = Player.objects.get(telegram_id=telegram_id)
            # Принудительно увеличиваем тапы для теста
            player.total_taps = 150
            player.save()

            # Проверяем достижения (используем статический метод)
            new_achievements = AchievementsView.check_and_award_achievements(player)

            return Response({
                "player_taps": player.total_taps,
                "new_achievements": new_achievements,
                "crystals": player.crystals,
            })
        except Player.DoesNotExist:
            return Response({"error": "Player not found"}, status=404)


class TestDailyRewardView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        from datetime import date, timedelta

        telegram_id = request.GET.get("telegram_id", 777)
        try:
            player = Player.objects.get(telegram_id=telegram_id)
            daily, created = PlayerDailyReward.objects.get_or_create(player=player)

            # Для теста установим вчерашнюю дату
            daily.last_claim_date = date.today() - timedelta(days=1)
            daily.current_streak = 0
            daily.save()

            return Response({
                "current_streak": daily.current_streak,
                "last_claim_date": daily.last_claim_date,
                "message": "Теперь отправь POST /api/daily-reward (с авторизацией) для получения награды",
                "next_streak": daily.current_streak + 1,
            })
        except Exception as e:
            return Response({"error": str(e)})


class TestListAchievementsView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        achievements = []
        for ach in Achievement.objects.filter(is_active=True):
            achievements.append({
                "id": ach.id,
                "name": ach.name,
                "trigger_type": ach.trigger_type,
                "trigger_value": ach.trigger_value,
                "reward_crystals": ach.reward_crystals,
            })
        return Response({"achievements": achievements})
from django.conf import settings
from django.db import transaction
from django.db.models import F, Q
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
        payload = {"status": "ok"}
        # Диагностика: с телефона через туннель часто бьют в «другой» инстанс Django / другую БД.
        try:
            payload["achievement_active_count"] = Achievement.objects.filter(is_active=True).count()
        except Exception:
            payload["achievement_active_count"] = None
        return Response(payload)


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
            player = Player.objects.select_for_update().get(pk=player.pk)

            if player.coins < upgrade.base_price:
                return Response(
                    {"error": f"Not enough coins. Need {upgrade.base_price}, have {player.coins}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            player.coins -= upgrade.base_price
            player.save(update_fields=["coins"])

            PlayerUpgrade.objects.create(player=player, upgrade=upgrade)

            if upgrade.upgrade_type == "offline_extension":
                player.max_offline_minutes += int(upgrade.value)
                player.save(update_fields=["max_offline_minutes"])

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
    """Топ игроков: metric=earnings|crystals|prestige (как вкладки «Заработок / Алмазы / Закалки»)."""

    METRIC_FIELDS = {
        "earnings": "total_earned_all_time",
        "crystals": "crystals",
        "prestige": "prestige_count",
    }

    authentication_classes = [TelegramMiniAppAuthentication]
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            limit = int(request.query_params.get("limit", 20))
        except (TypeError, ValueError):
            limit = 20
        limit = max(1, min(limit, 100))

        metric = request.query_params.get("metric", "earnings")
        field = self.METRIC_FIELDS.get(metric, self.METRIC_FIELDS["earnings"])

        qs = list(Player.objects.order_by(f"-{field}", "telegram_id")[:limit])
        results = [
            {
                "rank": i + 1,
                "telegram_id": p.telegram_id,
                "first_name": p.first_name,
                "username": p.username,
                "photo_url": p.photo_url or "",
                "score": getattr(p, field),
            }
            for i, p in enumerate(qs)
        ]

        payload: dict = {
            "metric": metric,
            "total_players": Player.objects.count(),
            "results": results,
        }
        user = request.user
        if isinstance(user, TelegramPrincipal):
            player = user.player
            value = getattr(player, field)
            ahead_q = Q(**{f"{field}__gt": value}) | Q(
                **{field: value, "telegram_id__lt": player.telegram_id}
            )
            payload["me_rank"] = Player.objects.filter(ahead_q).count() + 1
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
            "icon_name": u.icon_name,
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
                # get_or_create: параллельные GET (dev / test-list) иначе дают UNIQUE на (player, achievement).
                _, created = PlayerAchievement.objects.get_or_create(
                    player=player,
                    achievement=ach,
                    defaults={},
                )
                if not created:
                    continue
                if ach.reward_crystals > 0:
                    player.crystals += ach.reward_crystals
                if ach.reward_coins > 0:
                    player.coins += ach.reward_coins
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
        return Response(achievements_response_data(principal.player))


def achievements_response_data(player: Player) -> dict:
    """Тело ответа GET /api/achievements/ (и dev-лист без initData)."""
    new_achievements = AchievementsView.check_and_award_achievements(player)
    earned_ids = set(
        pa.achievement_id for pa in PlayerAchievement.objects.filter(player=player)
    )
    all_achievements = []
    for ach in Achievement.objects.filter(is_active=True).order_by("sort_order", "id"):
        all_achievements.append(
            {
                "id": ach.id,
                "name": ach.name,
                "description": ach.description,
                "icon_name": ach.icon_name or "",
                "trigger_type": ach.trigger_type,
                "trigger_value": ach.trigger_value,
                "reward_crystals": ach.reward_crystals,
                "reward_coins": ach.reward_coins,
                "is_earned": ach.id in earned_ids,
            }
        )
    return {"achievements": all_achievements, "new_achievements": new_achievements}


# ========== ЕЖЕДНЕВНЫЕ НАГРАДЫ ==========

def _daily_config_for_streak(streak: int):
    """Награда за день серии: цикл 1–7 (как в «Капле Руперта»), streak 8 → снова день 1."""
    if streak <= 0:
        slot = 1
    else:
        slot = ((streak - 1) % 7) + 1
    try:
        return DailyRewardConfig.objects.get(day_number=slot, is_active=True)
    except DailyRewardConfig.DoesNotExist:
        return DailyRewardConfig.objects.filter(is_active=True).order_by("day_number").first()


def _daily_reward_day_configs():
    """Статичные награды по слотам 1..7 для сетки и API."""
    rows = []
    for d in range(1, 8):
        cfg = DailyRewardConfig.objects.filter(day_number=d, is_active=True).first()
        rows.append(
            {
                "day": d,
                "reward_coins": cfg.reward_coins if cfg else 0,
                "reward_crystals": cfg.reward_crystals if cfg else 0,
            }
        )
    return rows


def _daily_day_schedule(daily: PlayerDailyReward, can_claim: bool, next_streak: int):
    """Состояния ячеек 1–7: claimed / claimable / locked."""
    base = _daily_reward_day_configs()
    if can_claim:
        claim_slot = ((max(next_streak, 1) - 1) % 7) + 1
        out = []
        for row in base:
            d = row["day"]
            if d < claim_slot:
                st = "claimed"
            elif d == claim_slot:
                st = "claimable"
            else:
                st = "locked"
            out.append({**row, "status": st})
        return out

    last_slot = ((max(daily.current_streak, 1) - 1) % 7) + 1
    out = []
    for row in base:
        d = row["day"]
        if d <= last_slot:
            st = "claimed"
        else:
            st = "locked"
        out.append({**row, "status": st})
    return out


def _daily_reward_status(daily: PlayerDailyReward, today):
    """Только чтение: можно ли забрать сегодня, номер следующего дня награды, слот 1–7 для сетки."""
    last = daily.last_claim_date
    if last == today:
        can_claim = False
        next_streak = daily.current_streak
        streak_display = daily.current_streak
    elif last is None:
        can_claim = True
        next_streak = 1
        streak_display = 1  # первый визит — как «день 1» в сетке
    elif (today - last).days > 1:
        can_claim = True
        next_streak = 1
        streak_display = 1
    else:
        can_claim = True
        next_streak = daily.current_streak + 1
        streak_display = daily.current_streak

    day_slot = ((max(next_streak, 1) - 1) % 7) + 1 if can_claim else ((max(daily.current_streak, 1) - 1) % 7) + 1
    if not can_claim and daily.current_streak == 0:
        day_slot = 1

    reward_coins, reward_crystals = 0, 0
    cfg = _daily_config_for_streak(next_streak) if can_claim else _daily_config_for_streak(daily.current_streak)
    if cfg:
        reward_coins, reward_crystals = cfg.reward_coins, cfg.reward_crystals

    cfg7 = DailyRewardConfig.objects.filter(day_number=7, is_active=True).first()
    weekly_bonus_crystals = cfg7.reward_crystals if cfg7 else 0

    slot_for_bonus = day_slot if can_claim else ((max(daily.current_streak, 1) - 1) % 7) + 1
    days_to_weekly_bonus = max(0, 7 - slot_for_bonus)

    day_schedule = _daily_day_schedule(daily, can_claim, next_streak)

    return {
        "can_claim": can_claim,
        "current_streak": daily.current_streak,
        "max_streak": daily.max_streak,
        "last_claim_date": daily.last_claim_date,
        "streak_display": streak_display,
        "next_reward_day": next_streak,
        "day_slot": day_slot,
        "reward_coins": reward_coins,
        "reward_crystals": reward_crystals,
        "days_to_weekly_bonus": days_to_weekly_bonus,
        "weekly_bonus_crystals": weekly_bonus_crystals,
        "day_schedule": day_schedule,
    }


class DailyRewardView(APIView):
    """GET — статус и превью награды (без изменений в БД). POST — забрать награду за сегодня."""
    authentication_classes = [TelegramMiniAppAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from datetime import date

        principal: TelegramPrincipal = request.user
        player = principal.player

        daily, _created = PlayerDailyReward.objects.get_or_create(
            player=player,
            defaults={
                "last_claim_date": None,
                "current_streak": 0,
                "max_streak": 0,
            },
        )

        today = date.today()
        payload = _daily_reward_status(daily, today)
        if not payload["can_claim"]:
            msg = "Награда уже получена сегодня. Загляните завтра!"
        else:
            msg = ""
        payload["message"] = msg
        return Response(payload)

    def post(self, request):
        from datetime import date

        principal: TelegramPrincipal = request.user
        player = principal.player

        daily, _created = PlayerDailyReward.objects.get_or_create(
            player=player,
            defaults={
                "last_claim_date": None,
                "current_streak": 0,
                "max_streak": 0,
            },
        )

        today = date.today()
        if daily.last_claim_date == today:
            return Response(
                {"detail": "Уже получено сегодня", "can_claim": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if daily.last_claim_date is None:
            next_streak = 1
        elif (today - daily.last_claim_date).days > 1:
            next_streak = 1
        else:
            next_streak = daily.current_streak + 1

        reward_config = _daily_config_for_streak(next_streak)
        if not reward_config:
            return Response(
                {"detail": "Награда не настроена"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        reward_coins = reward_config.reward_coins
        reward_crystals = reward_config.reward_crystals

        with transaction.atomic():
            player.coins += reward_coins
            player.crystals += reward_crystals
            player.save()

            daily.last_claim_date = today
            daily.current_streak = next_streak
            if daily.current_streak > daily.max_streak:
                daily.max_streak = daily.current_streak
            daily.save()

        payload = _daily_reward_status(daily, today)
        payload["message"] = f"День {next_streak}! +{reward_coins} монет"
        if reward_crystals:
            payload["message"] += f" +{reward_crystals} ◆"
        return Response(payload)






class UpgradeComponentView(APIView):
    """Прокачка компонента в магазине (увеличение уровня)"""
    authentication_classes = [TelegramMiniAppAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        item_id = request.data.get("item_id")
        quantity = request.data.get("quantity", 1)  # количество улучшений (1, 10, 50)

        try:
            item = Item.objects.get(id=item_id, is_active=True, show_in_shop=True, upgrade_by="manual")
        except Item.DoesNotExist:
            return Response({"error": "Component not found"}, status=404)

        principal: TelegramPrincipal = request.user
        player = principal.player

        player_item, created = PlayerItem.objects.get_or_create(
            player=player,
            item=item,
            defaults={"quantity": 1 if item.is_default else 0, "level": 1}
        )

        # Стоимость повышения уровня
        price_per_upgrade = item.base_price
        total_price = price_per_upgrade * quantity

        if player.coins < total_price:
            return Response({"error": f"Need {total_price} coins"}, status=400)

        with transaction.atomic():
            player.coins -= total_price
            player.save()

            # Увеличиваем уровень (максимум 10)
            new_level = min(player_item.level + quantity, 10)
            player_item.level = new_level
            player_item.save()

            # Пересчитываем доход (если компонент даёт доход)
            player.recalculate_income_per_second()

        return Response({
            "success": True,
            "item_id": item.id,
            "item_name": item.name,
            "new_level": new_level,
            "coins_left": player.coins,
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
    """Браузерный dev (initData=dev): полный список достижений для игрока без Telegram-подписи."""

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        try:
            telegram_id = int(request.GET.get("telegram_id", 777))
        except ValueError:
            return Response(
                {"achievements": [], "new_achievements": [], "error": "bad_telegram_id"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if telegram_id != 777:
            try:
                player = Player.objects.get(telegram_id=telegram_id)
            except Player.DoesNotExist:
                return Response(
                    {"achievements": [], "new_achievements": [], "error": "player_not_found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            player, created = Player.objects.get_or_create(
                telegram_id=777,
                defaults={
                    "username": "dev",
                    "first_name": "Разработчик",
                    "coins": 100_000,
                    "total_taps": 1_000,
                    "crystals": 10,
                    "total_earned_all_time": 1_000_000,
                    "prestige_count": 1,
                },
            )
            if created:
                player.recalculate_income_per_second()
        return Response(achievements_response_data(player))



class TestComponentUpgradeView(APIView):
    """Тестовый эндпоинт для прокачки компонента (dev-режим, без авторизации)"""
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        telegram_id = request.GET.get("telegram_id", 777)
        item_id = int(request.GET.get("item_id", 1))
        quantity = int(request.GET.get("quantity", 1))

        try:
            player = Player.objects.get(telegram_id=telegram_id)
            item = Item.objects.get(id=item_id, is_active=True, show_in_shop=True, upgrade_by="manual")
        except (Player.DoesNotExist, Item.DoesNotExist):
            return Response({"error": "Player or component not found"}, status=404)

        player_item, created = PlayerItem.objects.get_or_create(
            player=player,
            item=item,
            defaults={"quantity": 1 if item.is_default else 0, "level": 1}
        )

        price_per_upgrade = item.base_price
        total_price = price_per_upgrade * quantity

        if player.coins < total_price:
            return Response({"error": f"Need {total_price} coins"}, status=400)

        new_level = min(player_item.level + quantity, 10)
        player_item.level = new_level
        player_item.save()

        player.coins -= total_price
        player.save()

        player.recalculate_income_per_second()

        return Response({
            "success": True,
            "item_id": item.id,
            "item_name": item.name,
            "old_level": player_item.level - quantity,
            "new_level": new_level,
            "coins_left": player.coins,
            "income_per_second": player.cached_income_per_second,
        })
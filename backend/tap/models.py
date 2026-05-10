from django.db import models, transaction
from django.utils import timezone

# --- Аналог механик «Капля Руперта» (референс) → эта кодовая база ---
# • Валюта / тапы: coins + total_taps — как «очки» в кликере; синхрон с сервером через X-Telegram-Init-Data.
# • Магазин инструментов (плоскогубцы, +/сек): модели Item + PlayerItem; цена растёт по price_increase_factor.
# • Вкладки «Апгр.»: Upgrade + PlayerUpgrade (множители клика/дохода, оффлайн-лимит).
# • «Закал.» (престиж): prestige_count, crystals, perform_prestige() — сброс прогресса, премиум-валюта.
# • «Топ»: LeaderboardView по total_taps (в референсе может быть другой критерий — легко сменить сортировку).
# • «Цели»: Achievement + PlayerAchievement.
# • Подписка на канал + /privacy в боте: в проекте пока нет — см. комментарий в run_telegram_bot.py.
# • Образовательные «факты» в UI: на фронте можно добавить массив подсказок (как лампочка в референсе).


class Player(models.Model):
    telegram_id = models.BigIntegerField(unique=True, db_index=True)
    username = models.CharField(max_length=255, blank=True, default="")
    first_name = models.CharField(max_length=255, blank=True, default="")
    photo_url = models.URLField(max_length=512, blank=True, default="")

    # Основная валюта
    coins = models.PositiveBigIntegerField(default=0)
    total_taps = models.PositiveBigIntegerField(default=0)

    # Премиум валюта (алмазы/кристаллы)
    crystals = models.PositiveBigIntegerField(default=0)

    # Для закалки/престижа
    total_earned_all_time = models.PositiveBigIntegerField(default=0)  # всего заработано за всё время
    prestige_count = models.PositiveIntegerField(default=0)  # сколько раз закалялся

    # Оффлайн прогресс
    last_seen_at = models.DateTimeField(default=timezone.now)
    max_offline_minutes = models.PositiveIntegerField(default=180)  # 3 часа по умолчанию

    # Кэш пассивного дохода (чтобы не пересчитывать каждый раз)
    cached_income_per_second = models.PositiveBigIntegerField(default=0)

    # Для синхронизации с фронтом
    last_sync_at = models.DateTimeField(default=timezone.now)

    # Реферальная система
    referred_by = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="referrals",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-total_taps"]

    def __str__(self) -> str:
        return f"{self.telegram_id} ({self.username or self.first_name or 'anon'})"

    def claim_offline_income(self):
        """Начисляет оффлайн доход с учётом лимита максимум 3 часа (или улучшенного лимита)"""
        now = timezone.now()
        seconds_passed = int((now - self.last_seen_at).total_seconds())

        # Ограничиваем максимальным временем (по умолчанию 3 часа = 10800 секунд)
        max_seconds = self.max_offline_minutes * 60
        if seconds_passed > max_seconds:
            seconds_passed = max_seconds

        if seconds_passed > 0 and self.cached_income_per_second > 0:
            income = seconds_passed * self.cached_income_per_second
            self.coins += income
            self.total_earned_all_time += income

        self.last_seen_at = now
        self.save(update_fields=["coins", "total_earned_all_time", "last_seen_at"])
        return seconds_passed

    def recalculate_income_per_second(self):
        """Пересчитывает пассивный доход с учётом всех множителей"""
        # Получаем все предметы игрока
        player_items = PlayerItem.objects.filter(player=self).select_related("item")

        base_income = 0
        for pi in player_items:
            base_income += pi.quantity * pi.item.base_income_per_second

        # Получаем множитель дохода из улучшений
        income_multiplier = 1.0
        player_upgrades = PlayerUpgrade.objects.filter(
            player=self,
            upgrade__upgrade_type="income_multiplier"
        ).select_related("upgrade")

        for pu in player_upgrades:
            income_multiplier *= pu.upgrade.value

        self.cached_income_per_second = int(base_income * income_multiplier)
        self.save(update_fields=["cached_income_per_second"])
        return self.cached_income_per_second

    def can_prestige(self) -> bool:
        """Проверяет, может ли игрок сделать закалку"""
        # Порог закалки — 500 миллиардов (500_000_000_000)
        PRESTIGE_THRESHOLD = 500_000_000_000
        return self.total_earned_all_time >= PRESTIGE_THRESHOLD

    def perform_prestige(self) -> dict:
        """Выполняет закалку: сбрасывает прогресс, выдаёт алмазы"""
        if not self.can_prestige():
            return {"success": False, "error": "Not enough total earnings"}

        # Расчёт алмазов (кристаллов) за закалку
        # База: 1 алмаз за каждые 100B заработанных сверх порога
        PRESTIGE_THRESHOLD = 500_000_000_000
        excess = self.total_earned_all_time - PRESTIGE_THRESHOLD
        crystals_earned = max(1, int(excess / 100_000_000_000))  # минимум 1 алмаз

        with transaction.atomic():
            # Увеличиваем счётчик закалок
            self.prestige_count += 1

            # Добавляем алмазы
            self.crystals += crystals_earned

            # Сбрасываем монеты и предметы
            self.coins = 0

            # Сбрасываем количество предметов
            PlayerItem.objects.filter(player=self).update(quantity=0)

            # Очищаем доступные улучшения (не небесные)
            PlayerUpgrade.objects.filter(player=self, upgrade__is_celestial=False).delete()

            # Обновляем время последнего визита
            self.last_seen_at = timezone.now()
            self.last_sync_at = timezone.now()

            # Пересчитываем доход
            self.save()
            self.recalculate_income_per_second()

        return {
            "success": True,
            "prestige_count": self.prestige_count,
            "crystals_earned": crystals_earned,
            "total_crystals": self.crystals,
            "total_earned_all_time": self.total_earned_all_time,
        }


class Item(models.Model):
    """Предметы магазина (плоскогубцы, молотки, паяльники и т.д.)"""
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    base_income_per_second = models.PositiveBigIntegerField(default=0)  # сколько дают /сек
    base_price = models.PositiveBigIntegerField(default=100)
    price_increase_factor = models.FloatField(default=1.15)  # на сколько дорожает при покупке (15%)
    sort_order = models.PositiveIntegerField(default=0)  # для порядка в магазине

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.name

    def get_price_for_quantity(self, current_quantity: int, quantity: int = 1) -> int:
        """Считает цену покупки quantity штук, учитывая текущее количество"""
        total = 0
        for i in range(quantity):
            total += int(self.base_price * (self.price_increase_factor ** (current_quantity + i)))
        return total


class PlayerItem(models.Model):
    """Связь игрока с предметами (сколько куплено)"""
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name="items")
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.PositiveBigIntegerField(default=0)

    class Meta:
        unique_together = [["player", "item"]]

    def __str__(self):
        return f"{self.player} has {self.quantity} x {self.item.name}"


class Upgrade(models.Model):
    """Улучшения (закалённые руки, алмазная закалка и т.д.)"""
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    is_celestial = models.BooleanField(default=False)  # небесные апгрейды не сбрасываются

    # Тип улучшения
    UPGRADE_TYPES = [
        ("click_multiplier", "Умножитель клика"),
        ("income_multiplier", "Умножитель пассивного дохода"),
        ("offline_extension", "Увеличение оффлайн лимита"),
        ("special", "Особое"),
    ]
    upgrade_type = models.CharField(max_length=50, choices=UPGRADE_TYPES, default="income_multiplier")

    value = models.FloatField(default=1.0)  # множитель (2.0 = х2) или количество минут для offline_extension
    base_price = models.PositiveBigIntegerField(default=1000)

    # Условия открытия
    min_total_taps = models.PositiveBigIntegerField(default=0)
    min_prestige_count = models.PositiveIntegerField(default=0)
    required_item = models.ForeignKey(Item, null=True, blank=True, on_delete=models.SET_NULL,
                                      related_name="required_upgrades")
    required_item_quantity = models.PositiveIntegerField(default=0)

    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.name


class PlayerUpgrade(models.Model):
    """Какие улучшения купил игрок"""
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name="upgrades")
    upgrade = models.ForeignKey(Upgrade, on_delete=models.CASCADE)
    purchased_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [["player", "upgrade"]]

    def __str__(self):
        return f"{self.player} bought {self.upgrade.name}"


# ========== НЕБЕСНЫЕ АПГРЕЙДЫ ==========

class CelestialUpgrade(models.Model):
    """Небесные апгрейды — покупаются за алмазы, не сбрасываются при закалке"""
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")

    UPGRADE_TYPES = [
        ("global_income", "Глобальный множитель дохода"),
        ("tap_bonus", "Бонус к тапам"),
        ("offline_boost", "Увеличение оффлайн лимита"),
        ("auto_tap", "Авто-тап (каждую секунду)"),
    ]
    upgrade_type = models.CharField(max_length=50, choices=UPGRADE_TYPES, default="global_income")

    value = models.FloatField(default=1.0)  # множитель или бонус
    price_crystals = models.PositiveIntegerField(default=100)  # цена в алмазах

    max_level = models.PositiveIntegerField(default=10)  # максимальный уровень
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"{self.name} (алмазы: {self.price_crystals})"


class PlayerCelestialUpgrade(models.Model):
    """Какие небесные апгрейды купил игрок и на каком уровне"""
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name="celestial_upgrades")
    upgrade = models.ForeignKey(CelestialUpgrade, on_delete=models.CASCADE)
    level = models.PositiveIntegerField(default=1)
    purchased_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [["player", "upgrade"]]

    def __str__(self):
        return f"{self.player} has {self.upgrade.name} lvl {self.level}"


# ========== ДОСТИЖЕНИЯ (АЧИВКИ) ==========

class Achievement(models.Model):
    """Достижения для игроков"""
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")

    TRIGGER_TYPES = [
        ("total_taps", "Всего тапов"),
        ("total_coins_earned", "Всего заработано монет"),
        ("prestige_count", "Количество закалок"),
        ("items_bought", "Количество купленных предметов"),
        ("crystals_spent", "Потрачено алмазов"),
    ]
    trigger_type = models.CharField(max_length=50, choices=TRIGGER_TYPES, default="total_taps")
    trigger_value = models.PositiveBigIntegerField(default=1000)  # сколько нужно для выполнения

    reward_crystals = models.PositiveIntegerField(default=10)  # награда алмазами
    reward_coins = models.PositiveBigIntegerField(default=0)  # награда монетами

    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["trigger_type", "trigger_value"]

    def __str__(self):
        return f"{self.name} ({self.trigger_type}: {self.trigger_value})"


class PlayerAchievement(models.Model):
    """Какие достижения получил игрок"""
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name="achievements")
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    claimed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [["player", "achievement"]]

    def __str__(self):
        return f"{self.player} earned {self.achievement.name}"


# ========== ЕЖЕДНЕВНЫЕ НАГРАДЫ ==========

class DailyRewardConfig(models.Model):
    """Настройка ежедневных наград"""
    day_number = models.PositiveIntegerField(unique=True)  # день 1,2,3...
    reward_coins = models.PositiveBigIntegerField(default=1000)
    reward_crystals = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["day_number"]

    def __str__(self):
        return f"Day {self.day_number}: {self.reward_coins} coins"


class PlayerDailyReward(models.Model):
    """Состояние ежедневных наград игрока"""
    player = models.OneToOneField(Player, on_delete=models.CASCADE, related_name="daily_reward")
    last_claim_date = models.DateField(null=True, blank=True)
    current_streak = models.PositiveIntegerField(default=0)
    max_streak = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.player} streak: {self.current_streak}"
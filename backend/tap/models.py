from django.db import models
from django.utils import timezone


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
    last_seen_at = models.DateTimeField(auto_now_add=True)
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
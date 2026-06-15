from django.contrib import admin
from .models import (
    Player, Item, PlayerItem, Upgrade, PlayerUpgrade,
    CelestialUpgrade, PlayerCelestialUpgrade,
    Achievement, PlayerAchievement,
    DailyRewardConfig, PlayerDailyReward
)


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ("telegram_id", "username", "first_name", "coins", "crystals", "total_taps", "prestige_count", "total_earned_all_time", "created_at")
    search_fields = ("telegram_id", "username", "first_name")
    raw_id_fields = ("referred_by",)
    readonly_fields = ("total_earned_all_time", "cached_income_per_second")
    list_filter = ("prestige_count", "created_at")


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "base_income_per_second", "base_price", "price_increase_factor", "is_active", "sort_order")
    list_editable = ("base_price", "is_active", "sort_order")
    search_fields = ("name",)
    list_filter = ("is_active",)


@admin.register(PlayerItem)
class PlayerItemAdmin(admin.ModelAdmin):
    list_display = ("id", "player", "item", "quantity")
    search_fields = ("player__username", "item__name")
    list_filter = ("item",)


@admin.register(Upgrade)
class UpgradeAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "icon_name", "upgrade_type", "value", "base_price", "is_celestial", "is_active", "sort_order")
    list_editable = ("base_price", "is_active", "sort_order", "is_celestial")
    search_fields = ("name", "icon_name")
    list_filter = ("upgrade_type", "is_celestial", "is_active")


@admin.register(PlayerUpgrade)
class PlayerUpgradeAdmin(admin.ModelAdmin):
    list_display = ("id", "player", "upgrade", "purchased_at")
    search_fields = ("player__username", "upgrade__name")
    list_filter = ("upgrade",)


@admin.register(CelestialUpgrade)
class CelestialUpgradeAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "upgrade_type", "value", "price_crystals", "max_level", "is_active", "sort_order")
    list_editable = ("price_crystals", "max_level", "is_active", "sort_order")
    search_fields = ("name",)
    list_filter = ("upgrade_type", "is_active")


@admin.register(PlayerCelestialUpgrade)
class PlayerCelestialUpgradeAdmin(admin.ModelAdmin):
    list_display = ("id", "player", "upgrade", "level", "purchased_at")
    search_fields = ("player__username", "upgrade__name")
    list_filter = ("upgrade", "level")


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "icon_name", "trigger_type", "trigger_value", "reward_crystals", "reward_coins", "is_active")
    list_editable = ("trigger_value", "reward_crystals", "reward_coins", "is_active")
    search_fields = ("name", "icon_name")
    list_filter = ("trigger_type", "is_active")


@admin.register(PlayerAchievement)
class PlayerAchievementAdmin(admin.ModelAdmin):
    list_display = ("id", "player", "achievement", "claimed_at")
    search_fields = ("player__username", "achievement__name")
    list_filter = ("achievement",)


@admin.register(DailyRewardConfig)
class DailyRewardConfigAdmin(admin.ModelAdmin):
    list_display = ("day_number", "reward_coins", "reward_crystals", "is_active")
    list_editable = ("reward_coins", "reward_crystals", "is_active")
    ordering = ("day_number",)


@admin.register(PlayerDailyReward)
class PlayerDailyRewardAdmin(admin.ModelAdmin):
    list_display = ("id", "player", "last_claim_date", "current_streak", "max_streak")
    search_fields = ("player__username",)
    list_filter = ("current_streak",)
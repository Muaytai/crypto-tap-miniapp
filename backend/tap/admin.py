from django.contrib import admin

from .models import Player


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ("telegram_id", "username", "total_taps", "coins", "referred_by", "created_at")
    search_fields = ("telegram_id", "username", "first_name")
    raw_id_fields = ("referred_by",)

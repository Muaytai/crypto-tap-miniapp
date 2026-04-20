from rest_framework import serializers

from .models import Player


class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = (
            "telegram_id",
            "username",
            "first_name",
            "photo_url",
            "total_taps",
            "coins",
            "referred_by_id",
        )
        read_only_fields = fields


class TapSyncSerializer(serializers.Serializer):
    taps_delta = serializers.IntegerField(min_value=0, max_value=500_000)

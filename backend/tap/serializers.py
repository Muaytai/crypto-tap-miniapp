from rest_framework import serializers
from .models import Player, Item, PlayerItem, Upgrade, PlayerUpgrade


class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = (
            "telegram_id",
            "username",
            "first_name",
            "photo_url",
            "coins",
            "total_taps",
            "crystals",
            "total_earned_all_time",
            "prestige_count",
            "max_offline_minutes",
            "cached_income_per_second",
            "referred_by_id",
        )
        read_only_fields = fields


class TapSyncSerializer(serializers.Serializer):
    taps_delta = serializers.IntegerField(min_value=0, max_value=10000)
    coins_delta = serializers.IntegerField(min_value=0, max_value=10_000_000, required=False, default=0)


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = "__all__"


class PlayerItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    item_icon = serializers.CharField(source="item.icon_name", read_only=True)
    item_base_income = serializers.IntegerField(source="item.base_income_per_second", read_only=True)
    item_base_price = serializers.IntegerField(source="item.base_price", read_only=True)

    class Meta:
        model = PlayerItem
        fields = ("item_id", "item_name", "item_icon", "quantity", "level", "item_base_income", "item_base_price")


class UpgradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Upgrade
        fields = "__all__"


class PlayerUpgradeSerializer(serializers.ModelSerializer):
    upgrade_name = serializers.CharField(source="upgrade.name", read_only=True)
    upgrade_icon = serializers.CharField(source="upgrade.icon_name", read_only=True)
    upgrade_type = serializers.CharField(source="upgrade.upgrade_type", read_only=True)
    upgrade_value = serializers.FloatField(source="upgrade.value", read_only=True)

    class Meta:
        model = PlayerUpgrade
        fields = ("upgrade_id", "upgrade_name", "upgrade_icon", "upgrade_type", "upgrade_value", "purchased_at")


class FullStateSerializer(serializers.Serializer):
    player = PlayerSerializer()
    items = PlayerItemSerializer(many=True)
    upgrades = PlayerUpgradeSerializer(many=True)
    available_items = ItemSerializer(many=True)
    available_upgrades = UpgradeSerializer(many=True)
    income_per_second = serializers.IntegerField()


class BuyItemSerializer(serializers.Serializer):
    item_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, max_value=100)


class BuyUpgradeSerializer(serializers.Serializer):
    upgrade_id = serializers.IntegerField()
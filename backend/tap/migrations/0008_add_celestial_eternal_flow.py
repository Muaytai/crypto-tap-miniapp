# Add "Вечный поток" celestial upgrade (after Кристальный резонанс)

from django.db import migrations


def add_eternal_flow_upgrade(apps, schema_editor):
    CelestialUpgrade = apps.get_model("tap", "CelestialUpgrade")

    CelestialUpgrade.objects.get_or_create(
        name="Вечный поток",
        defaults={
            "description": "Оффлайн-накопление: до 12 ч вместо 8",
            "upgrade_type": "offline_boost",
            "value": 12.0,
            "price_crystals": 15,
            "max_level": 1,
            "sort_order": 400,
            "icon_name": "⏰",
            "is_active": True,
        },
    )


def remove_eternal_flow_upgrade(apps, schema_editor):
    CelestialUpgrade = apps.get_model("tap", "CelestialUpgrade")
    CelestialUpgrade.objects.filter(name="Вечный поток").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("tap", "0007_seed_default_achievements"),
    ]

    operations = [
        migrations.RunPython(add_eternal_flow_upgrade, remove_eternal_flow_upgrade),
    ]

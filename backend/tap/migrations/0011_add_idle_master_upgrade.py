# Add "Мастер простоя" celestial upgrade

from django.db import migrations, models


CELESTIAL_UPGRADE_TYPE_CHOICES = [
    ("global_income", "Глобальный множитель дохода"),
    ("tap_bonus", "Бонус к тапам"),
    ("offline_boost", "Увеличение оффлайн лимита"),
    ("auto_tap", "Авто-тап (каждую секунду)"),
    ("start_boost", "Начальный бонус осколков"),
    ("referral_boost", "Бонус за приглашённого друга"),
    ("idle_master", "Мастер пассивного дохода"),
]


def add_idle_master(apps, schema_editor):
    CelestialUpgrade = apps.get_model("tap", "CelestialUpgrade")
    CelestialUpgrade.objects.get_or_create(
        name="Мастер простоя",
        defaults={
            "description": "Пассивный доход: 70% первые 30 мин, 20% до 2ч (было 50%/10%)",
            "upgrade_type": "idle_master",
            "value": 1.4,
            "price_crystals": 25,
            "max_level": 1,
            "sort_order": 500,
            "icon_name": "🌙",
            "is_active": True,
        },
    )


def remove_idle_master(apps, schema_editor):
    CelestialUpgrade = apps.get_model("tap", "CelestialUpgrade")
    CelestialUpgrade.objects.filter(name="Мастер простоя").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("tap", "0010_replace_eternal_flow_with_link_booster"),
    ]

    operations = [
        migrations.AlterField(
            model_name="celestialupgrade",
            name="upgrade_type",
            field=models.CharField(
                choices=CELESTIAL_UPGRADE_TYPE_CHOICES,
                default="global_income",
                max_length=50,
            ),
        ),
        migrations.RunPython(add_idle_master, remove_idle_master),
    ]

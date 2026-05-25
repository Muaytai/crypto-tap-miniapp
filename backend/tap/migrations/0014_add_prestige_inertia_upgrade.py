# Add "Инерция закалки" celestial upgrade

from django.db import migrations, models


CELESTIAL_UPGRADE_TYPE_CHOICES = [
    ("global_income", "Глобальный множитель дохода"),
    ("tap_bonus", "Бонус к тапам"),
    ("offline_boost", "Увеличение оффлайн лимита"),
    ("auto_tap", "Авто-тап (каждую секунду)"),
    ("start_boost", "Начальный бонус осколков"),
    ("referral_boost", "Бонус за приглашённого друга"),
    ("idle_master", "Мастер пассивного дохода"),
    ("lab_discount", "Скидка на лаборатории"),
    ("daily_login_crystal", "Бонус алмазов за ежедневный вход"),
    ("prestige_inertia", "Инерция после перезакалки"),
]


def add_prestige_inertia(apps, schema_editor):
    CelestialUpgrade = apps.get_model("tap", "CelestialUpgrade")
    CelestialUpgrade.objects.get_or_create(
        name="Инерция закалки",
        defaults={
            "description": "После перезакалки начни с 5% от прошлого заработка",
            "upgrade_type": "prestige_inertia",
            "value": 0.05,
            "price_crystals": 60,
            "max_level": 1,
            "sort_order": 750,
            "icon_name": "↻",
            "is_active": True,
        },
    )


def remove_prestige_inertia(apps, schema_editor):
    CelestialUpgrade = apps.get_model("tap", "CelestialUpgrade")
    CelestialUpgrade.objects.filter(name="Инерция закалки").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("tap", "0013_add_daily_tempering_upgrade"),
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
        migrations.RunPython(add_prestige_inertia, remove_prestige_inertia),
    ]

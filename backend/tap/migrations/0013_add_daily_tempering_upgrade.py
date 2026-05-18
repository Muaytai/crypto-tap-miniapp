# Add "Ежедневная закалка" celestial upgrade

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
]


def add_daily_tempering(apps, schema_editor):
    CelestialUpgrade = apps.get_model("tap", "CelestialUpgrade")
    CelestialUpgrade.objects.get_or_create(
        name="Ежедневная закалка",
        defaults={
            "description": "+1 алмаз за каждый день входа в игру",
            "upgrade_type": "daily_login_crystal",
            "value": 1.0,
            "price_crystals": 40,
            "max_level": 1,
            "sort_order": 700,
            "icon_name": "📅",
            "is_active": True,
        },
    )


def remove_daily_tempering(apps, schema_editor):
    CelestialUpgrade = apps.get_model("tap", "CelestialUpgrade")
    CelestialUpgrade.objects.filter(name="Ежедневная закалка").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("tap", "0012_add_wholesale_purchase_upgrade"),
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
        migrations.RunPython(add_daily_tempering, remove_daily_tempering),
    ]

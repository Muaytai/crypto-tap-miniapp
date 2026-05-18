# Add "Оптовая закупка" celestial upgrade

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
]


def add_wholesale_purchase(apps, schema_editor):
    CelestialUpgrade = apps.get_model("tap", "CelestialUpgrade")
    CelestialUpgrade.objects.get_or_create(
        name="Оптовая закупка",
        defaults={
            "description": "Все лаборатории на 10% дешевле",
            "upgrade_type": "lab_discount",
            "value": 0.9,
            "price_crystals": 35,
            "max_level": 1,
            "sort_order": 600,
            "icon_name": "🏷️",
            "is_active": True,
        },
    )


def remove_wholesale_purchase(apps, schema_editor):
    CelestialUpgrade = apps.get_model("tap", "CelestialUpgrade")
    CelestialUpgrade.objects.filter(name="Оптовая закупка").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("tap", "0011_add_idle_master_upgrade"),
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
        migrations.RunPython(add_wholesale_purchase, remove_wholesale_purchase),
    ]

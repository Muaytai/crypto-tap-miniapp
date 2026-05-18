# Replace "Вечный поток" with "Усилитель связей"

from django.db import migrations, models


CELESTIAL_UPGRADE_TYPE_CHOICES = [
    ("global_income", "Глобальный множитель дохода"),
    ("tap_bonus", "Бонус к тапам"),
    ("offline_boost", "Увеличение оффлайн лимита"),
    ("auto_tap", "Авто-тап (каждую секунду)"),
    ("start_boost", "Начальный бонус осколков"),
    ("referral_boost", "Бонус за приглашённого друга"),
]


def apply_link_booster(apps, schema_editor):
    CelestialUpgrade = apps.get_model("tap", "CelestialUpgrade")
    CelestialUpgrade.objects.filter(name="Вечный поток").update(
        name="Усилитель связей",
        description="Бонус за друга: +15% вместо +10%",
        upgrade_type="referral_boost",
        value=1.05,
        price_crystals=20,
        icon_name="🤝",
    )


def restore_eternal_flow(apps, schema_editor):
    CelestialUpgrade = apps.get_model("tap", "CelestialUpgrade")
    CelestialUpgrade.objects.filter(name="Усилитель связей").update(
        name="Вечный поток",
        description="Оффлайн-накопление: до 12 ч вместо 8",
        upgrade_type="offline_boost",
        value=12.0,
        price_crystals=15,
        icon_name="⏰",
    )


class Migration(migrations.Migration):

    dependencies = [
        ("tap", "0009_resonance_icon_diamond"),
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
        migrations.RunPython(apply_link_booster, restore_eternal_flow),
    ]

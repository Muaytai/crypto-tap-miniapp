# Add "Квантовый резонанс" celestial upgrade

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
    ("quantum_resonance", "Удвоенный бонус алмазов за закалку"),
]


def add_quantum_resonance(apps, schema_editor):
    CelestialUpgrade = apps.get_model("tap", "CelestialUpgrade")
    CelestialUpgrade.objects.get_or_create(
        name="Квантовый резонанс",
        defaults={
            "description": "Удвоенный бонус алмазов",
            "upgrade_type": "quantum_resonance",
            "value": 2.0,
            "price_crystals": 80,
            "max_level": 1,
            "sort_order": 800,
            "icon_name": "💠",
            "is_active": True,
        },
    )


def remove_quantum_resonance(apps, schema_editor):
    CelestialUpgrade = apps.get_model("tap", "CelestialUpgrade")
    CelestialUpgrade.objects.filter(name="Квантовый резонанс").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("tap", "0015_prestige_inertia_round_arrow_icon"),
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
        migrations.RunPython(add_quantum_resonance, remove_quantum_resonance),
    ]

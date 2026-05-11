# Generated migration to add two more celestial upgrades

from django.db import migrations


def add_new_upgrades(apps, schema_editor):
    """Add 'Память мышц' and 'Кристальный резонанс' celestial upgrades"""
    CelestialUpgrade = apps.get_model('tap', 'CelestialUpgrade')
    
    CelestialUpgrade.objects.get_or_create(
        name='Память мышц',
        defaults={
            'description': 'Стартовый апгрейд «Крепкие пальцы» (+1 к клику)',
            'upgrade_type': 'tap_bonus',
            'value': 1.0,
            'price_crystals': 5,
            'max_level': 1,
            'sort_order': 200,
            'is_active': True,
        }
    )
    
    CelestialUpgrade.objects.get_or_create(
        name='Кристальный резонанс',
        defaults={
            'description': 'Бонус за алмазы: +7% вместо +5%',
            'upgrade_type': 'global_income',
            'value': 1.04,  # 4% дополнительного бонуса
            'price_crystals': 10,
            'max_level': 1,
            'sort_order': 300,
            'is_active': True,
        }
    )


def reverse_new_upgrades(apps, schema_editor):
    """Remove the new celestial upgrades"""
    CelestialUpgrade = apps.get_model('tap', 'CelestialUpgrade')
    CelestialUpgrade.objects.filter(name__in=['Память мышц', 'Кристальный резонанс']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('tap', '0004_add_starter_boost_upgrade'),
    ]

    operations = [
        migrations.RunPython(add_new_upgrades, reverse_new_upgrades),
    ]

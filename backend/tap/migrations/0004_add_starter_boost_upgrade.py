# Generated migration to add "Крепкий старт" celestial upgrade

from django.db import migrations


def add_starter_boost_upgrade(apps, schema_editor):
    """Add the 'Крепкий старт' celestial upgrade"""
    CelestialUpgrade = apps.get_model('tap', 'CelestialUpgrade')
    
    CelestialUpgrade.objects.get_or_create(
        name='Крепкий старт',
        defaults={
            'description': 'Начиная каждый цикл с 5,000 осколков',
            'upgrade_type': 'start_boost',
            'value': 5000.0,
            'price_crystals': 3,
            'max_level': 1,
            'sort_order': 100,
            'is_active': True,
        }
    )


def reverse_starter_boost_upgrade(apps, schema_editor):
    """Remove the 'Крепкий старт' celestial upgrade"""
    CelestialUpgrade = apps.get_model('tap', 'CelestialUpgrade')
    CelestialUpgrade.objects.filter(name='Крепкий старт').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('tap', '0003_achievement_celestialupgrade_dailyrewardconfig_item_and_more'),
    ]

    operations = [
        migrations.RunPython(add_starter_boost_upgrade, reverse_starter_boost_upgrade),
    ]

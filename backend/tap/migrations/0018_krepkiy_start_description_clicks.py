# Описание «Крепкий старт»: осколков → кликов

from django.db import migrations


def update_description(apps, schema_editor):
    CelestialUpgrade = apps.get_model("tap", "CelestialUpgrade")
    CelestialUpgrade.objects.filter(name="Крепкий старт").update(
        description="Начиная каждый цикл с 5,000 кликов",
    )


def revert_description(apps, schema_editor):
    CelestialUpgrade = apps.get_model("tap", "CelestialUpgrade")
    CelestialUpgrade.objects.filter(name="Крепкий старт").update(
        description="Начиная каждый цикл с 5,000 осколков",
    )


class Migration(migrations.Migration):

    dependencies = [
        ("tap", "0017_item_image_url_item_is_default_item_level_and_more"),
    ]

    operations = [
        migrations.RunPython(update_description, revert_description),
    ]

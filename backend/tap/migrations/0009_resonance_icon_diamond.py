# Set diamond icon for "Кристальный резонанс"

from django.db import migrations


def set_resonance_icon(apps, schema_editor):
    CelestialUpgrade = apps.get_model("tap", "CelestialUpgrade")
    CelestialUpgrade.objects.filter(name="Кристальный резонанс").update(icon_name="💎")


def clear_resonance_icon(apps, schema_editor):
    CelestialUpgrade = apps.get_model("tap", "CelestialUpgrade")
    CelestialUpgrade.objects.filter(name="Кристальный резонанс").update(icon_name="")


class Migration(migrations.Migration):

    dependencies = [
        ("tap", "0008_add_celestial_eternal_flow"),
    ]

    operations = [
        migrations.RunPython(set_resonance_icon, clear_resonance_icon),
    ]

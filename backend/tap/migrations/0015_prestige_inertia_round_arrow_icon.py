# Icon for "Инерция закалки": rounded circular arrow

from django.db import migrations


def set_round_arrow_icon(apps, schema_editor):
    CelestialUpgrade = apps.get_model("tap", "CelestialUpgrade")
    CelestialUpgrade.objects.filter(name="Инерция закалки").update(icon_name="↻")


def restore_refresh_icon(apps, schema_editor):
    CelestialUpgrade = apps.get_model("tap", "CelestialUpgrade")
    CelestialUpgrade.objects.filter(name="Инерция закалки").update(icon_name="🔄")


class Migration(migrations.Migration):

    dependencies = [
        ("tap", "0014_add_prestige_inertia_upgrade"),
    ]

    operations = [
        migrations.RunPython(set_round_arrow_icon, restore_refresh_icon),
    ]

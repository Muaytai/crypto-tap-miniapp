# Ensures Achievement rows exist after migrate (avoids empty 0/0 UI when seed command was never run).

from django.core.management import call_command
from django.db import migrations


def seed(apps, schema_editor):
    call_command("seed_achievements")


class Migration(migrations.Migration):

    dependencies = [
        ("tap", "0006_achievement_icon_name_celestialupgrade_icon_name_and_more"),
    ]

    operations = [
        migrations.RunPython(seed, migrations.RunPython.noop),
    ]

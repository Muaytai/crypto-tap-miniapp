from django.core.management.base import BaseCommand

from tap.models import Upgrade


class Command(BaseCommand):
    help = "Set icon_name=upgrade_{id} for all upgrades"

    def handle(self, *args, **options):
        updated = 0
        for upg in Upgrade.objects.all().only("id", "icon_name"):
            expected = f"upgrade_{upg.pk}"
            if upg.icon_name != expected:
                Upgrade.objects.filter(pk=upg.pk).update(icon_name=expected)
                updated += 1
        self.stdout.write(self.style.SUCCESS(f"Upgrade icons synced: updated={updated}"))

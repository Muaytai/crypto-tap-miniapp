from django.core.management.base import BaseCommand

from tap.models import Achievement


class Command(BaseCommand):
    help = "Set icon_name=achievement_{id} for all achievements"

    def handle(self, *args, **options):
        updated = 0
        for ach in Achievement.objects.all().only("id", "icon_name"):
            expected = f"achievement_{ach.pk}"
            if ach.icon_name != expected:
                Achievement.objects.filter(pk=ach.pk).update(icon_name=expected)
                updated += 1
        self.stdout.write(
            self.style.SUCCESS(f"Achievement icons synced: updated={updated}")
        )

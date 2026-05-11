from django.core.management.base import BaseCommand

from tap.models import DailyRewardConfig

# Дни 1–6: растущая награда монетами (в духе «Капли Руперта»); день 7 — 5 кристаллов.
ROWS = [
    (1, 1_000, 0),
    (2, 2_500, 0),
    (3, 5_000, 0),
    (4, 10_000, 0),
    (5, 20_000, 0),
    (6, 40_000, 0),
    (7, 0, 5),
]


class Command(BaseCommand):
    help = "Create/update DailyRewardConfig rows for a 7-day streak (Rupert-style ramp + day 7 crystals)"

    def handle(self, *args, **options):
        created = 0
        updated = 0
        for day_number, reward_coins, reward_crystals in ROWS:
            obj, was_created = DailyRewardConfig.objects.update_or_create(
                day_number=day_number,
                defaults={
                    "reward_coins": reward_coins,
                    "reward_crystals": reward_crystals,
                    "is_active": True,
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1
        self.stdout.write(self.style.SUCCESS(f"Daily rewards seeded: created={created}, updated={updated}"))

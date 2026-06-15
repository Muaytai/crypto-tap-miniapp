from django.core.management.base import BaseCommand

from tap.models import Item

# name, description, icon_name, base_income_per_second, base_price, sort_order
SHOP_ITEMS = [
    (
        "Диван",
        "Базовый уголок лаборатории — немного пассивного хеш-рейта.",
        "sofa",
        2,
        100,
        1,
    ),
    (
        "Стол",
        "Рабочая поверхность для сборки рига.",
        "desk",
        3,
        150,
        2,
    ),
    (
        "Ноутбук",
        "Координирует ноды и открывает продвинутые улучшения.",
        "laptop",
        4,
        200,
        3,
    ),
    (
        "Стул",
        "Удобнее сидеть — чуть больше стабильного дохода.",
        "chair",
        1,
        50,
        4,
    ),
]


class Command(BaseCommand):
    help = "Create/update shop items (lab components) for Crypto Tap"

    def handle(self, *args, **options):
        created = 0
        updated = 0
        for name, description, icon_name, income, price, sort_order in SHOP_ITEMS:
            _, was_created = Item.objects.update_or_create(
                name=name,
                defaults={
                    "description": description,
                    "icon_name": icon_name,
                    "base_income_per_second": income,
                    "base_price": price,
                    "sort_order": sort_order,
                    "is_active": True,
                    "show_in_shop": True,
                    "upgrade_by": "manual",
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1
        self.stdout.write(self.style.SUCCESS(f"Shop items seeded: created={created}, updated={updated}"))

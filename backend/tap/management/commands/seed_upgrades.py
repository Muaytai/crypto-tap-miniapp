from django.core.management.base import BaseCommand

from tap.models import Item, Upgrade

# name, description, icon_name, upgrade_type, value, base_price, min_total_taps,
# min_prestige_count, required_item_name, required_item_quantity, sort_order
BASE_UPGRADES = [
    (
        "Закалённые руки",
        "Каждый тап приносит вдвое больше осколков.",
        "",
        "click_multiplier",
        2.0,
        500,
        0,
        0,
        None,
        0,
        1,
    ),
    (
        "Двойной хеш",
        "Усиливает силу клика — как повторный прогон nonce.",
        "",
        "click_multiplier",
        1.5,
        5000,
        1000,
        0,
        None,
        0,
        2,
    ),
    (
        "ASIC-пальцы",
        "Клики бьют по монетам, как чип под SHA-256.",
        "",
        "click_multiplier",
        2.0,
        50000,
        10000,
        0,
        None,
        0,
        3,
    ),
    (
        "Lightning tap",
        "Мгновенные клики — максимальный множитель тапа.",
        "",
        "click_multiplier",
        3.0,
        500000,
        100000,
        0,
        None,
        0,
        4,
    ),
    (
        "Разгон рига",
        "Пассивный доход от лаборатории +25%.",
        "",
        "income_multiplier",
        1.25,
        2000,
        500,
        0,
        None,
        0,
        5,
    ),
    (
        "Пул хешей",
        "Объединённый хеш-рейт фермы усиливает доход в секунду.",
        "",
        "income_multiplier",
        1.5,
        25000,
        5000,
        0,
        None,
        0,
        6,
    ),
    (
        "Дата-центр ×2",
        "Промышленный масштаб: пассивный доход удваивается.",
        "",
        "income_multiplier",
        2.0,
        250000,
        50000,
        0,
        None,
        0,
        7,
    ),
    (
        "Удлинённая смена",
        "Оффлайн-накопление ещё на 1 час (поверх базового лимита).",
        "",
        "offline_extension",
        60,
        5000,
        0,
        0,
        None,
        0,
        8,
    ),
    (
        "Ночная ферма",
        "Риг копит осколки дольше, пока вы offline.",
        "",
        "offline_extension",
        120,
        50000,
        2500,
        0,
        None,
        0,
        9,
    ),
    (
        "12-часовой буфер",
        "До 12 часов пассивного дохода без входа в игру.",
        "",
        "offline_extension",
        360,
        500000,
        25000,
        0,
        None,
        0,
        10,
    ),
]

NEW_UPGRADES = [
    (
        "Мощная ферма",
        "Риг работает на полную — пассивный доход от лаборатории +30%.",
        "power_farm",
        "income_multiplier",
        1.3,
        750000,
        75000,
        0,
        None,
        0,
        11,
    ),
    (
        "Сильный тап",
        "Каждый клик приносит на 75% больше осколков.",
        "strong_tap",
        "click_multiplier",
        1.75,
        1200000,
        150000,
        0,
        None,
        0,
        12,
    ),
    (
        "Ночной запас",
        "Риг копит монеты ещё 3 часа, пока вы не в игре.",
        "night_reserve",
        "offline_extension",
        180,
        900000,
        40000,
        0,
        None,
        0,
        13,
    ),
    (
        "Связка ригов",
        "Нужен ноутбук: риги работают вместе — общий доход ×1.75.",
        "rig_link",
        "income_multiplier",
        1.75,
        1500000,
        100000,
        0,
        "Ноутбук",
        1,
        14,
    ),
    (
        "Большой сейф",
        "Монеты дольше копятся offline — ещё +4 часа к лимиту.",
        "big_vault",
        "offline_extension",
        240,
        2500000,
        200000,
        0,
        None,
        0,
        15,
    ),
]

# Старые названия — деактивируем, не удаляя из БД.
DEPRECATED_NAMES = [
    "Первый блок",
    "Разгон вентиляторов",
    "Мемпул пальцев",
    "Синхронизация нод",
    "Холодный кошелёк",
    "Halving-буст",
    "Taproot-пальцы",
    "Мемпул-резерв",
    "Merge-майнинг",
    "Layer-2 склад",
]


class Command(BaseCommand):
    help = "Seed base (10) + new (5) shop upgrades for Crypto Tap"

    def handle(self, *args, **options):
        created = 0
        updated = 0

        for row in BASE_UPGRADES + NEW_UPGRADES:
            if self._upsert(row):
                created += 1
            else:
                updated += 1

        deprecated = Upgrade.objects.filter(name__in=DEPRECATED_NAMES).update(is_active=False)

        self.stdout.write(
            self.style.SUCCESS(
                f"Upgrades seeded: created={created}, updated={updated}, deprecated={deprecated}"
            )
        )

    def _upsert(self, row) -> bool:
        (
            name,
            description,
            icon_name,
            upgrade_type,
            value,
            base_price,
            min_total_taps,
            min_prestige_count,
            required_item_name,
            required_item_quantity,
            sort_order,
        ) = row

        required_item = None
        if required_item_name:
            try:
                required_item = Item.objects.get(name=required_item_name, is_active=True)
            except Item.DoesNotExist:
                self.stderr.write(
                    self.style.WARNING(
                        f'Item "{required_item_name}" not found — run seed_items first. '
                        f'Skipping required_item for "{name}".'
                    )
                )

        _, was_created = Upgrade.objects.update_or_create(
            name=name,
            defaults={
                "description": description,
                "icon_name": icon_name,
                "upgrade_type": upgrade_type,
                "value": value,
                "base_price": base_price,
                "min_total_taps": min_total_taps,
                "min_prestige_count": min_prestige_count,
                "required_item": required_item,
                "required_item_quantity": required_item_quantity,
                "sort_order": sort_order,
                "is_active": True,
                "is_celestial": False,
            },
        )
        return was_created

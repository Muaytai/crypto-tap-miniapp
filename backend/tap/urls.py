from django.urls import path

from . import views

urlpatterns = [
    # Дубли без `/`: иначе APPEND_SLASH отдаёт 301 на http://127.0.0.1:8000/... — с HTTPS-туннеля fetch ломается.
    #Health и конфиги
    path("health", views.HealthView.as_view()),
    path("health/", views.HealthView.as_view(), name="health"),
    path("public-config", views.PublicConfigView.as_view()),
    path("public-config/", views.PublicConfigView.as_view(), name="public-config"),

    # Игрок
    path("me", views.MeView.as_view()),
    path("me/", views.MeView.as_view(), name="me"),
    path("state", views.FullStateView.as_view()),
    path("state/", views.FullStateView.as_view(), name="state"),

    # Игровая механика
    path("taps/sync", views.TapSyncView.as_view()),
    path("taps/sync/", views.TapSyncView.as_view(), name="tap-sync"),

    # Магазин и улучшения
    path("shop/buy", views.BuyItemView.as_view()),
    path("shop/buy/", views.BuyItemView.as_view(), name="shop-buy"),
    path("upgrades/buy", views.BuyUpgradeView.as_view()),
    path("upgrades/buy/", views.BuyUpgradeView.as_view(), name="upgrades-buy"),

    # Закалка
    path("prestige", views.PrestigeView.as_view()),
    path("prestige/", views.PrestigeView.as_view(), name="prestige"),

    # Лидерборд
    path("leaderboard", views.LeaderboardView.as_view()),
    path("leaderboard/", views.LeaderboardView.as_view(), name="leaderboard"),

    # Небесные апгрейды
    path("celestial-upgrades", views.CelestialUpgradeListView.as_view()),
    path("celestial-upgrades/", views.CelestialUpgradeListView.as_view(), name="celestial-upgrades"),
    path("celestial/buy", views.BuyCelestialUpgradeView.as_view()),
    path("celestial/buy/", views.BuyCelestialUpgradeView.as_view(), name="celestial-buy"),

    # Достижения
    path("achievements", views.AchievementsView.as_view()),
    path("achievements/", views.AchievementsView.as_view(), name="achievements"),

    # Ежедневные награды
    path("daily-reward", views.DailyRewardView.as_view()),
    path("daily-reward/", views.DailyRewardView.as_view(), name="daily-reward"),

    # улучшение по лэалу компонента
    path("component/upgrade", views.UpgradeComponentView.as_view()),
    path("component/upgrade/", views.UpgradeComponentView.as_view(), name="component-upgrade"),

    # ВРЕМЕННЫЕ ТЕСТОВЫЕ ЭНДПОИНТЫ
    path("test-auth", views.TestAuthView.as_view()),
    path("test-auth/", views.TestAuthView.as_view(), name="test-auth"),
    path("test-buy", views.TestBuyView.as_view()),
    path("test-buy/", views.TestBuyView.as_view(), name="test-buy"),
    path("test-buy-upgrade", views.TestBuyUpgradeView.as_view()),
    path("test-buy-upgrade/", views.TestBuyUpgradeView.as_view(), name="test-buy-upgrade"),
    path("test-state", views.TestStateView.as_view()),
    path("test-state/", views.TestStateView.as_view(), name="test-state"),
    path("test-prestige", views.TestPrestigeView.as_view()),
    path("test-prestige/", views.TestPrestigeView.as_view(), name="test-prestige"),
    path("test-achievements", views.TestAchievementsView.as_view()),
    path("test-achievements/", views.TestAchievementsView.as_view(), name="test-achievements"),
    path("test-daily", views.TestDailyRewardView.as_view()),
    path("test-daily/", views.TestDailyRewardView.as_view(), name="test-daily"),
    path("test-list-achievements", views.TestListAchievementsView.as_view()),
    path("test-component-upgrade", views.TestComponentUpgradeView.as_view()),
    path("test-component-upgrade/", views.TestComponentUpgradeView.as_view(), name="test-component-upgrade"),
    path("test-list-achievements/", views.TestListAchievementsView.as_view(), name="test-list-achievements"),
]
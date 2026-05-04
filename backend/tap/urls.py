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

    # Лидерборд
    path("leaderboard", views.LeaderboardView.as_view()),
    path("leaderboard/", views.LeaderboardView.as_view(), name="leaderboard"),

    # ВРЕМЕННЫЙ ТЕСТОВЫЙ ЭНДПОИНТ (удалить потом)
    path("test-auth", views.TestAuthView.as_view()),
    path("test-auth/", views.TestAuthView.as_view(), name="test-auth"),
]

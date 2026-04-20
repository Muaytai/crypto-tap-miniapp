from django.urls import path

from . import views

urlpatterns = [
    # Дубли без `/`: иначе APPEND_SLASH отдаёт 301 на http://127.0.0.1:8000/... — с HTTPS-туннеля fetch ломается.
    path("health", views.HealthView.as_view()),
    path("health/", views.HealthView.as_view(), name="health"),
    path("public-config", views.PublicConfigView.as_view()),
    path("public-config/", views.PublicConfigView.as_view(), name="public-config"),
    path("me", views.MeView.as_view()),
    path("me/", views.MeView.as_view(), name="me"),
    path("taps/sync", views.TapSyncView.as_view()),
    path("taps/sync/", views.TapSyncView.as_view(), name="tap-sync"),
    path("leaderboard", views.LeaderboardView.as_view()),
    path("leaderboard/", views.LeaderboardView.as_view(), name="leaderboard"),
]

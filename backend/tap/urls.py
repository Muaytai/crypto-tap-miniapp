from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.HealthView.as_view(), name="health"),
    path("me/", views.MeView.as_view(), name="me"),
    path("taps/sync/", views.TapSyncView.as_view(), name="tap-sync"),
]

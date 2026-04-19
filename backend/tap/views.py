from django.db.models import F
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import TelegramMiniAppAuthentication, TelegramPrincipal
from .serializers import PlayerSerializer, TapSyncSerializer


class HealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({"status": "ok"})


class MeView(APIView):
    authentication_classes = [TelegramMiniAppAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        principal: TelegramPrincipal = request.user
        return Response(PlayerSerializer(principal.player).data)


class TapSyncView(APIView):
    authentication_classes = [TelegramMiniAppAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TapSyncSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        delta = serializer.validated_data["taps_delta"]
        principal: TelegramPrincipal = request.user
        player = principal.player

        Player.objects.filter(pk=player.pk).update(
            total_taps=F("total_taps") + delta,
            coins=F("coins") + delta,
        )
        player.refresh_from_db()
        return Response(PlayerSerializer(player).data)

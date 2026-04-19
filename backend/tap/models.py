from django.db import models


class Player(models.Model):
    telegram_id = models.BigIntegerField(unique=True, db_index=True)
    username = models.CharField(max_length=255, blank=True, default="")
    first_name = models.CharField(max_length=255, blank=True, default="")
    total_taps = models.PositiveBigIntegerField(default=0)
    coins = models.PositiveBigIntegerField(default=0)
    referred_by = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="referrals",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-total_taps"]

    def __str__(self) -> str:
        return f"{self.telegram_id} ({self.username or self.first_name or 'anon'})"

import uuid
from datetime import timedelta  # Importante para fazer as contas de tempo

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone


# TODO: Depois
# class BackGroundSound(model.Model): ...  # Musica de fundo
# class Property(model.Model): ... # local proprietário
class TimestampModel(models.Model):
    objects = models.Manager()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class PlanChoices(models.TextChoices):
    MENSAL = "mensal", "Mensal"
    ANUAL = "anual", "Anual"
    EXPERIMENTACAO = "experimentacao", "Experimentação"


class MusicStatus(models.TextChoices):
    PENDING = "pending", "Pendente"
    ACCEPTED = "accepted", "Aceita"
    REJECTED = "rejected", "Rejeitada"


class MusicCategory(models.TextChoices):
    INTERACTIVE = "interactive", "Reações"
    BACKGROUND = "background", "Fundo"


class Plan(TimestampModel):
    name = models.CharField(
        max_length=50, choices=PlanChoices.choices, default=PlanChoices.MENSAL
    )

    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):

        if self.start_date is None:
            self.start_date = timezone.now()

        if self.name == PlanChoices.EXPERIMENTACAO:
            self.end_date = self.start_date + timedelta(hours=2)

        elif self.name == PlanChoices.MENSAL:
            self.end_date = self.start_date + timedelta(days=30)

        elif self.name == PlanChoices.ANUAL:
            self.end_date = self.start_date + timedelta(days=365)

        super().save(*args, **kwargs)


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey(
        Plan, on_delete=models.SET_NULL, null=True, blank=True, related_name="users"
    )
    is_admin = models.BooleanField(default=False)
    is_manager = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.plan:
            plan = Plan.objects.create(name=PlanChoices.EXPERIMENTACAO)
            self.plan = plan

        super().save(*args, **kwargs)

    def __str__(self):
        is_admin = "S" if self.is_admin else "N"
        is_manager = "S" if self.is_admin else "N"
        plan = self.plan.end_date.date() if self.plan else "Não atribuído"
        return f"Nome: {self.username} | Gerente: {is_manager} | Administrador: {is_admin} | Fim do Plano: {plan}"

    class Meta:
        db_table = "users"


# TODO: A listagem de musicas deve poder mostrar a qual evento ele deve ser
# vinculado, um estágio anterior antes da confirmação do manager em aceitar
# ou não a musica
# TODO: A musica deve ter flag para ser de interação ou background
class YoutubeMusic(TimestampModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    url = models.URLField(max_length=255, blank=True, null=True)
    file = models.FileField(upload_to="musics/", blank=True, null=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="musics",
    )
    observation = models.CharField(max_length=255, blank=True, null=True)
    singer = models.CharField(max_length=50, blank=True, null=True)
    duration = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta(TimestampModel.Meta):
        db_table = "youtube_musics"
        constraints = [
            models.UniqueConstraint(
                fields=["name", "url"], name="unique_name_url_combination"
            )
        ]


# NOTE: O usuário pode criar evento?
class Event(TimestampModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    start_date = models.DateField()
    end_date = models.DateField()
    event_name = models.CharField(max_length=100, unique=True)
    location = models.CharField(max_length=100, null=True, blank=True)
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="managed_events",
        null=True,
        blank=True,
    )
    is_active = models.BooleanField(default=True)

    def __str__(self):
        display_name = "Não informado"
        if self.manager:
            display_name = self.manager.username
        return f"Gerente: {display_name} - {self.event_name.capitalize()}"

    class Meta(TimestampModel.Meta):
        db_table = "events"


class Folder(TimestampModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="subfolders"
    )
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="folders")

    def __str__(self):
        return f"Pasta: {self.name} - Evento: {self.event.event_name}"

    class Meta(TimestampModel.Meta):
        db_table = "folders"


class MusicOrder(TimestampModel):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False, null=False, blank=False
    )
    music = models.ForeignKey(
        YoutubeMusic, on_delete=models.CASCADE, null=False, blank=False
    )
    event = models.ForeignKey(Event, on_delete=models.CASCADE, null=False, blank=False)
    order = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(30)]
    )
    status = models.CharField(
        max_length=20, choices=MusicStatus.choices, default=MusicStatus.PENDING
    )
    category = models.CharField(
        max_length=20, choices=MusicCategory.choices, default=MusicCategory.INTERACTIVE
    )
    folder = models.ForeignKey(
        Folder, on_delete=models.SET_NULL, null=True, blank=True, related_name="music_orders"
    )
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Ordem: {self.order} Evento: {self.event.event_name} | Musica {self.music.name}"

    class Meta(TimestampModel.Meta):
        db_table = "music_order"
        constraints = [
            models.UniqueConstraint(
                fields=["event", "music"], name="unique_event_music_combination"
            ),
            models.UniqueConstraint(
                fields=["event", "order"], name="unique_event_order_combination"
            ),
        ]

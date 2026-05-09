from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
import uuid 
from django.utils import timezone
from datetime import timedelta # Importante para fazer as contas de tempo

# NOTE: Depois
# class BackGroundSound(model.Model): ...  # Musica de fundo
# class Property(model.Model): ... # local proprietário
class TimestampModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class PlanChoices(models.TextChoices): # <--- Mude de Choices para TextChoices
    MENSAL = "mensal", "Mensal"
    ANUAL = "anual", "Anual"
    EXPERIMENTACAO = "experimentacao", "Experimentação"

class Plan(TimestampModel):
    # Adicionei o parametro choices=CHOICES aqui
    name = models.CharField(max_length=50, choices=PlanChoices.choices, default=PlanChoices.MENSAL) 
    
    # MUDANÇA: Mudou de DateField para DateTimeField (para suportar horas)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.start_date:
            self.start_date = timezone.now()

        if self.name == "experimentacao":
            self.end_date = self.start_date + timedelta(hours=2)
            
        elif self.name == "mensal":
            self.end_date = self.start_date + timedelta(days=30)
            
        elif self.name == "anual":
            self.end_date = self.start_date + timedelta(days=365)

        super().save(*args, **kwargs)

    class Meta(TimestampModel.Meta):
        db_table = 'plan'


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    is_admin = models.BooleanField(default=False)
    is_manager = models.BooleanField(default=False)
    

    def save(self, *args, **kwargs):
        if not self.plan:
            plan = Plan.objects.create(name="experimentacao")
            self.plan = plan.id

        super().save(*args, **kwargs)

    def __str__(self):
        is_admin = "S" if self.is_admin else "N"
        is_manager = "S" if self.is_admin else "N"
        return f"Nome: {self.username} | Gerente: {is_manager} | Admin: {is_admin}"

    class Meta:
        db_table = 'users'


class YoutubeMusic(TimestampModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    url = models.URLField(max_length=255) # Use URLField, é mais semântico
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='musics')
    observation = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta(TimestampModel.Meta):
        db_table = 'youtube_musics'
        constraints = [
            models.UniqueConstraint(
                fields=['name', 'url'], 
                name='unique_name_url_combination' # Dê um nome descritivo para essa regra
            )
        ]


class Event(TimestampModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    start_date = models.DateField()
    end_date = models.DateField()
    event_name = models.CharField(max_length=100)
    manager = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='managed_events', null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        display_name = "Não informado"
        if self.manager:
            display_name = self.manager.username
        return f"Gerente: {display_name} - {self.event_name.capitalize()}"


    class Meta(TimestampModel.Meta):
        db_table = 'events'

class LinkEventMusic(TimestampModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    music_id = models.ForeignKey(YoutubeMusic, on_delete=models.CASCADE)
    event_id = models.ForeignKey(Event, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        display_name = "Não informado"
        if self.event_id.manager:
            display_name = self.event_id.manager.username
        return f"Gerente: {display_name} - {self.music_id.event_name.capitalize()}"

    class Meta(TimestampModel.Meta):
        db_table = 'link_event_musics'
        constraints = [
            models.UniqueConstraint(
                fields=['event_id', 'music_id'], 
                name='unique_event_music_combination' # Dê um nome descritivo para essa regra
            )
        ]


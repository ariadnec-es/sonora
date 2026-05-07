from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
import uuid 

# NOTE: Depois
# class BackGroundSound(model.Model): ...  # Musica de fundo
# class Propery(model.Model): ... # local proprietário
class TimestampModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Plan(TimestampModel): # Herdando o created_at
    name = models.CharField(max_length=50)
    class Meta:
        db_table = 'plan'


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    is_admin = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'users'


class YoutubeMusic(TimestampModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    url = models.URLField(max_length=255) # Use URLField, é mais semântico
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='musics')
    observation = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'youtube_music'


class Event(TimestampModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    start_date = models.DateField()
    end_date = models.DateField()
    event_name = models.CharField(max_length=100)
    youtube_music = models.ForeignKey(YoutubeMusic, on_delete=models.CASCADE, related_name='events')
    manager = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='managed_events')
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'event'
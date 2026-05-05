from django.db import models
from django.contrib.auth.models import AbstractUser

class Plan(models.Model):
    start_date = models.DateField()
    end_date = models.DateField()

    class Meta:
        db_table = 'plan'

class User(AbstractUser):
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name='users')
    is_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'users'

class YoutubeMusic(models.Model):
    name = models.CharField(max_length=100)
    url = models.CharField(max_length=255)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='musics')
    added_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'youtube_music'

class Event(models.Model):
    event_name = models.CharField(max_length=100)
    youtube_music = models.ForeignKey(YoutubeMusic, on_delete=models.CASCADE, related_name='events')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'event'

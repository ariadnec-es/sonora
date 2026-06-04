from django.contrib import admin

from .models import Event, Plan, User, YoutubeMusic, MusicOrder

models = [admin.site.register(model) for model in [User, Plan, YoutubeMusic, Event, MusicOrder]]

from django.contrib import admin

from .models import Event, Plan, User, YoutubeMusic

models = [User, Plan, YoutubeMusic, Event]

for model in models:
    admin.site.register(model)

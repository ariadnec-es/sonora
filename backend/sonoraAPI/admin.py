from django.contrib import admin
from .models import User, Plan, YoutubeMusic, Event
# Register your models here.

models = [
    User, Plan, YoutubeMusic, Event
]

for model in models:
    admin.site.register(model)
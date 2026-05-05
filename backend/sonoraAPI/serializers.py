from rest_framework import serializers
from .models import Plan, User, YoutubeMusic, Event

class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'plan', 'is_admin', 'created_at']


class YoutubeMusicSerializer(serializers.ModelSerializer):
    class Meta:
        model = YoutubeMusic
        fields = '__all__'


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'

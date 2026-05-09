from rest_framework import serializers
from .models import Plan, User, YoutubeMusic, Event


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    my_events = serializers.SerializerMethodField()
    my_sounds = serializers.SerializerMethodField()
    plan = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'plan', 'is_manager', "is_admin", "is_staff", "plan", "my_events", "my_sounds"
        ]

    def get_plan(self, instace: User):
        if instace.plan is not None:
            return PlanSerializer(instace.plan)
        return

    def get_my_events(self, instance: User):
        return Event.objects.filter(manager=instance).values() or []

    def get_my_sounds(self, instance: User):
        return YoutubeMusic.objects.filter(user=instance).values() or []
        
    def to_representation(self, instance: User):
        data = super().to_representation(instance)
            
        return data


class YoutubeMusicSerializer(serializers.ModelSerializer):
    class Meta:
        model = YoutubeMusic
        fields = '__all__'
        read_only_fields = ['id', 'added_at']


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = (
           "id",
            "start_date",
            "end_date",
            "event_name",
            "youtube_music",
            "is_active",
            "manager"

        )
        read_only_fields = ['id', 'created_at']


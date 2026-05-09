from django.db.models import F
from rest_framework import serializers
from .models import Plan, User, YoutubeMusic, Event, LinkEventMusic


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = "__all__"
        read_only_fields = ["id", "created_at"]


class UserSerializer(serializers.ModelSerializer):
    my_events = serializers.SerializerMethodField()
    my_sounds = serializers.SerializerMethodField()

    plan = PlanSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "plan",
            "is_manager",
            "is_admin",
            "is_staff",
            "my_events",
            "my_sounds",
        ]
        extra_kwargs = {
            "password": {"write_only": True}
        }

    def get_my_events(self, instance: User):
        return list(
            LinkEventMusic.objects.filter(
                event_id__manager=instance, event_id__is_active=True
            )
            .annotate(
                event_name=F("event_id__event_name"),
                music_name=F("music_id__name"),
                url=F("music_id__url"),
            )
            .values(
                "id",
                "music_name",
                "url",
                "event_name",
                "event_id",
                "music_id",
            )
        )

    def get_my_sounds(self, instance: User):
        return list(YoutubeMusic.objects.filter(user=instance).values())

    def to_representation(self, instance: User):
        data = super().to_representation(instance)

        return data

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


class YoutubeMusicSerializer(serializers.ModelSerializer):
    class Meta:
        model = YoutubeMusic
        fields = "__all__"
        read_only_fields = ["id"]


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ("id", "start_date", "end_date", "event_name", "is_active", "manager")
        read_only_fields = ["id", "created_at"]


class LinkEventMusicSerializer(serializers.ModelSerializer):
    class Meta:
        model = LinkEventMusic
        fields = ("id", "music_id", "event_id")

from django.db.models import F
from rest_framework import serializers
from ..models import User, YoutubeMusic, Event, Folder, MusicOrder
from .plans import PlanSerializer

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

    def get_my_events(self, instance):
        """Eventos, músicas e pastas"""
        
        # 1. Pega os eventos ativos gerenciados pelo usuário
        events = Event.objects.filter(manager=instance, is_active=True)
        events_id = events.values_list("id", flat=True)
        
        # 2. Query de Músicas (MusicOrder)
        flat_data = MusicOrder.objects.filter(
            event__in=events_id,
            is_active=True
        ).annotate(
            music_pk=F("music__id"),
            music_name=F("music__name"),
            music_url=F("music__url"),
            music_file=F("music__file"),
            event_name=F("event__event_name"),
            event_start_date=F("event__start_date"),
            event_end_date=F("event__end_date"),
            singer=F("music__singer"),
            duration=F("music__duration"),
        ).values(
            "id", "event", "event_name", "music_pk", "music_name",
            "music_url", "music_file", "event_start_date", "event_end_date",
            "singer", "duration", "order", "status", "category", "folder"
        ).order_by("event", "order")

        # 3. Query de Pastas
        folders_data = list(Folder.objects.filter(event__in=events_id).values(
            "id", "name", "parent", "event"
        ))

        grouped_events = {}
        for event in events:
            grouped_events[event.id] = {
                "event_id": event.id,
                "event_name": event.event_name,
                "event_start_date": event.start_date,
                "event_end_date": event.end_date,
                "musics": [],
                "folders": [f for f in folders_data if f["event"] == event.id]
            }

        for row in flat_data:
            event_id = row["event"]
            if event_id in grouped_events:
                grouped_events[event_id]["musics"].append({
                    "id": row["id"], # ID do MusicOrder
                    "music_id": row["music_pk"],
                    "name": row["music_name"],
                    "url": row["music_url"],
                    "file": row["music_file"],
                    "singer": row["singer"],
                    "duration": row["duration"],
                    "order": row["order"],
                    "status": row["status"],
                    "category": row["category"],
                    "folder": row["folder"]
                })
            
        return list(grouped_events.values())

    def get_my_sounds(self, instance):
        """Musicas que o usuário enviou"""
        return list(YoutubeMusic.objects.filter(user=instance).values())

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        request = self.context.get("request")
        if not (request and request.user.is_authenticated and request.user.is_admin):
            validated_data.pop("is_manager", None)
            validated_data.pop("is_admin", None)

        password = validated_data.pop("password", None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

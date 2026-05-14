from django.db.models import F
from rest_framework import serializers
from .models import Plan, User, YoutubeMusic, Event, MusicOrder

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

    def get_my_events(self, instance): # Retirei a tipagem (User) se não estiver importado, mas pode manter.
        """Eventos e músicas"""
        
        # 1. Pega os IDs dos eventos
        events_id = Event.objects.filter(manager=instance, is_active=True).values_list("id", flat=True)
        
        # 2. Query Plana
        flat_data = MusicOrder.objects.filter(
            event__in=events_id,
        ).annotate(
            music_name=F("music__name"),
            music_url=F("music__url"),
            event_name=F("event__event_name"),
            event_start_date=F("event__start_date"),
            event_end_date=F("event__end_date"),
            singer=F("music__singer"),
            duration=F("music__duration"),
        ).values(
            "event", # Esse é o ID do evento (útil para agrupar)
            "event_name", 
            "music_name",
            "music_url",
            "event_start_date",
            "event_end_date",
            "singer",
            "duration",
            "order",
        ).order_by("event", "order") # Melhor ordenar por evento primeiro, depois por ordem

        grouped_events = {}

        for row in flat_data:
            event_id = row["event"]
            
            if event_id not in grouped_events:
                grouped_events[event_id] = {
                    "event_id": event_id, # Sempre bom mandar o ID para o front-end
                    "event_name": row["event_name"], # Corrigido: usando o nome anotado
                    "event_start_date": row["event_start_date"],
                    "event_end_date": row["event_end_date"],
                    "musics": {} 
                }
            
            # Adiciona a música na ordem correspondente
            grouped_events[event_id]["musics"][row["order"]] = row["music_url"]
            
        # CORREÇÃO CRÍTICA: O return fica AQUI (fora do loop for)
        return list(grouped_events.values())
    def get_my_sounds(self, instance: User):
        """Musicas que o usuário enviou"""
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

class MusicOrderSerializer(serializers.ModelSerializer):
    # Campos aninhados apenas para visualização (Leitura)
    music_details = YoutubeMusicSerializer(source='music', read_only=True)
    event_details = EventSerializer(source='event', read_only=True)

    class Meta:
        model = MusicOrder
        fields = [
            'id', 
            'music', 
            'event', 
            'order', 
            'music_details', 
            'event_details', 
            'created_at', 
            'updated_at'
        ]

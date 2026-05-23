from rest_framework import serializers
from ..models import MusicOrder
from .musics import YoutubeMusicSerializer
from .events import EventSerializer

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

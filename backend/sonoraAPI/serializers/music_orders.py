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
            'status',
            'category',
            'folder',
            'music_details', 
            'event_details', 
            'created_at', 
            'updated_at'
        ]

    def validate(self, attrs):
        music = attrs.get('music')
        request = self.context.get('request')
        if music and request:
            user = request.user
            if music.user is not None:
                if not user.is_authenticated:
                    raise serializers.ValidationError({"music": "Você não tem permissão para adicionar esta música."})
                if not (user.is_admin or music.user == user):
                    raise serializers.ValidationError({"music": "Esta música pertence a outro usuário."})
        return attrs

from rest_framework import serializers
from ..models import YoutubeMusic

class YoutubeMusicSerializer(serializers.ModelSerializer):
    class Meta:
        model = YoutubeMusic
        fields = [
            "id", "name", "url", "file", "user", 
            "observation", "singer", "duration", "is_active",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

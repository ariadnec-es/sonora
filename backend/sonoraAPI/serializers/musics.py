from rest_framework import serializers
from ..models import YoutubeMusic

class YoutubeMusicSerializer(serializers.ModelSerializer):
    class Meta:
        model = YoutubeMusic
        fields = "__all__"
        read_only_fields = ["id"]

from rest_framework import serializers
from ..models import Folder

class FolderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Folder
        fields = ["id", "name", "parent", "event", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

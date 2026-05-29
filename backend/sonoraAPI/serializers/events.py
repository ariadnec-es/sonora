from rest_framework import serializers
from ..models import Event

class EventSerializer(serializers.ModelSerializer):
    manager_username = serializers.ReadOnlyField(source='manager.username')

    class Meta:
        model = Event
        fields = ("id", "start_date", "end_date", "event_name", "is_active", "manager", "manager_username")
        read_only_fields = ["id", "created_at"]

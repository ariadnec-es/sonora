from rest_framework import serializers
from .models import Plan, User, YoutubeMusic, Event

class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'plan', 'is_staff', "is_admin", "is_staff"]

    def to_representation(self, instance: User):
        data = super().to_representation(instance)
        staff_value = data.pop('is_staff')
        data['is_manager'] = staff_value
            
        return data

class YoutubeMusicSerializer(serializers.ModelSerializer):
    class Meta:
        model = YoutubeMusic
        fields = '__all__'
        read_only_fields = ['id', 'added_at']

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

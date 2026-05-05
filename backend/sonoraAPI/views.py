from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Plan, User, YoutubeMusic, Event
from .serializers import (
    PlanSerializer,
    UserSerializer,
    YoutubeMusicSerializer,
    EventSerializer
)

class PlanViewSet(viewsets.ModelViewSet):
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    permission_classes = [IsAuthenticated]


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]


class YoutubeMusicViewSet(viewsets.ModelViewSet):
    queryset = YoutubeMusic.objects.all()
    serializer_class = YoutubeMusicSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
# Create your views here.

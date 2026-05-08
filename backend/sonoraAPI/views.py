from datetime import date
from rest_framework import viewsets
from rest_framework import status
from rest_framework import permissions 
from rest_framework.response import Response
from .models import User, YoutubeMusic, Event
from .serializers import (
    UserSerializer,
    YoutubeMusicSerializer,
    EventSerializer
)
from django.http import JsonResponse
from rest_framework.decorators import action

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_admin:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)

    def perform_destroy(self, instance):
        if not self.request.user.is_admin:
            self.permission_denied(self.request)
        instance.is_active = False
        instance.save()

    def create(self, request, *args, **kwargs):
        data = request.data.copy() 
        user = User.objects.create_user(**data)
        return Response(self.serializer_class(user).data)

    @action(detail=False, methods=['GET'], url_path="managers")
    def managers(self, request):
        if request.user.is_admin:
            users = User.objects.filter(is_staff=True)
            serializer = self.get_serializer(users, many=True)
            return Response(serializer.data)
        if request.user.is_staff:
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)

        return Response([], status=status.HTTP_404_NOT_FOUND)

class YoutubeMusicViewSet(viewsets.ModelViewSet):
    serializer_class = YoutubeMusicSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = YoutubeMusic.objects.none()

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return YoutubeMusic.objects.all()
        return YoutubeMusic.objects.filter(user=user)

    def perform_destroy(self, instance):
        if self.request.user.is_admin or instance.user == self.request.user:
            instance.is_active = False
            instance.save()
        else:
            self.permission_denied(self.request)


class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Event.objects.none()
    
    def get_queryset(self):
        user = self.request.user
        hoje = date.today()
        
        if user.is_admin:
            qs = Event.objects.all()
        elif user.is_staff:
            qs = Event.objects.filter(manager=user)
        else:
            return Event.objects.none()
        return qs.filter(is_active=True, end_date__gte=hoje)


def ping(requests):
    """Verificação se servidor responde"""
    return JsonResponse({"message": "pong"} , safe=False)

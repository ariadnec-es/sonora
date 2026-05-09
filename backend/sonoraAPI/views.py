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
from django.shortcuts import get_object_or_404

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _default(self):
        return {
            "is_active": True,
        }

    def get_queryset(self):
        if self.request.user.is_admin:
            if self.request.query_params.get("managers", "false") == "true":
                filters = self._default() | {"is_staff": True}
                return User.objects.filter(**filters)
            return User.objects.filter(**self._default())
        return User.objects.filter(id=self.request.user.id)

    def perform_destroy(self, instance):
        if not self.request.user.is_admin:
            self.permission_denied(self.request)
        instance.is_active = False
        instance.save()

    def create(self, request, *args, **kwargs):
        if request.user.is_admin == False:
            return Response([], status=403)
        data = request.data.copy() 
        user = User.objects.create_user(**data)
        return Response(self.serializer_class(user).data)


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

    def create(self, request, *args, **kwargs):
        user = request.user
        data = request.data.copy() 
        data['user'] = user
        music = YoutubeMusic.objects.create(**data)
        return Response(self.serializer_class(music).data)

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
        return qs.filter()

    def create(self, request, *args, **kwargs):
        user = request.user

        if not user.is_staff or not user.is_admin:
            return Response([], status=403)

        data = request.data.copy() 
        data['manager'] = user
        event = Event.objects.create(**data)
        return Response(self.serializer_class(event).data)

def ping(requests):
    """Verificação se servidor responde"""
    return JsonResponse({"message": "pong"} , safe=False)

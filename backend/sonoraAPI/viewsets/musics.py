from django.db.models import Q
from rest_framework import permissions
from ..models import YoutubeMusic
from ..serializers.musics import YoutubeMusicSerializer
from .base import BaseViewSet

class YoutubeMusicViewSet(BaseViewSet):
    serializer_class = YoutubeMusicSerializer
    queryset = YoutubeMusic.objects.none()

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user

        base_filters = self.default_filters()

        if self.is_admin():
            return YoutubeMusic.objects.filter(**base_filters)

        if self.is_manager():
            """
            Manager pode:
            - ver próprias músicas
            - ver músicas ligadas aos eventos dele
            """

            return YoutubeMusic.objects.filter(
                Q(user=user) | Q(musicorder__event__manager=user), is_active=True
            ).distinct()

        """
        Usuário comum:
        apenas próprias músicas
        """
        return YoutubeMusic.objects.filter(user=user, **base_filters)

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)

    def can_delete(self, instance):
        user = self.request.user

        if self.is_admin():
            return True

        return instance.user == user

    def perform_update(self, serializer):
        instance = self.get_object()
        user = self.request.user

        if self.is_admin():
            serializer.save()
            return

        if instance.user != user:
            self.deny()

        serializer.save()

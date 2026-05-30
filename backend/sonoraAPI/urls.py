from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viewsets.users import UserViewSet
from .viewsets.musics import YoutubeMusicViewSet
from .viewsets.events import EventViewSet
from .viewsets.music_orders import MusicOrderViewSet
from .viewsets.folders import FolderViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'musics', YoutubeMusicViewSet)
router.register(r'events', EventViewSet)
router.register(r'music-order', MusicOrderViewSet)
router.register(r'folders', FolderViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

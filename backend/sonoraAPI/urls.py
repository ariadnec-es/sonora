from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet,
    YoutubeMusicViewSet,
    EventViewSet,
    LinkEventMusicViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'musics', YoutubeMusicViewSet)
router.register(r'events', EventViewSet)
router.register(r'link_event_music', LinkEventMusicViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

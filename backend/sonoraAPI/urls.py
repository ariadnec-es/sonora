from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet,
    YoutubeMusicViewSet,
    EventViewSet,
    MusicOrderViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'musics', YoutubeMusicViewSet)
router.register(r'events', EventViewSet)
router.register(r'music-order', MusicOrderViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

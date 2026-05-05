from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PlanViewSet,
    UserViewSet,
    YoutubeMusicViewSet,
    EventViewSet
)

router = DefaultRouter()
router.register(r'plans', PlanViewSet)
router.register(r'users', UserViewSet)
router.register(r'musics', YoutubeMusicViewSet)
router.register(r'events', EventViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

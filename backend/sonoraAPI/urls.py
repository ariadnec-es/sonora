from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .viewsets.dashboard import DashboardMetricsView
from .viewsets.events import EventViewSet
from .viewsets.folders import FolderViewSet
from .viewsets.music_orders import MusicOrderViewSet
from .viewsets.musics import YoutubeMusicViewSet
from .viewsets.users import UserViewSet

router = DefaultRouter()
router.register(r"users", UserViewSet)
router.register(r"musics", YoutubeMusicViewSet)
router.register(r"events", EventViewSet)
router.register(r"music-order", MusicOrderViewSet)
router.register(r"folders", FolderViewSet)
# router.register(r"dashboard", DashboardMetricsView, basename="dashboard")

urlpatterns = [
    # Registre a view do Dashboard diretamente nas urls utilizando .as_view()
    path("dashboard/", DashboardMetricsView.as_view(), name="dashboard-metrics"),
    # Rotas gerenciadas pelo router (ViewSets)
    path("", include(router.urls)),
]

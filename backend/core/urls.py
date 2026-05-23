from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from sonoraAPI.viewsets.utils import ping, renew_plan
from core import settings

API_PREFIX = "api/sonora/v1/"

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),

    # Auth
    path(f"{API_PREFIX}token/", TokenObtainPairView.as_view()),
    path(f"{API_PREFIX}token/refresh/", TokenRefreshView.as_view()),

    # App routes
    path(f"{API_PREFIX}", include("sonoraAPI.urls")),

    # Extra endpoints
    path(f"{API_PREFIX}renew_plan/", renew_plan, name="renew_plan"),
    path(f"{API_PREFIX}ping/", ping, name="ping"),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )

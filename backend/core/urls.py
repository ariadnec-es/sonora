from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from sonoraAPI.views import ping, renew_plan

from core import settings

prefix = "api/sonora"

urlpatterns = [
    # Admin page
    path("admin/", admin.site.urls),
    # Token authentication
    path(f"{prefix}/token/", TokenObtainPairView.as_view()),
    path(f"{prefix}/token/refresh/", TokenRefreshView.as_view()),
    # API endpoints
    path(f"{prefix}/v1/", include("sonoraAPI.urls")),
    path(f"{prefix}/renew_plan/", renew_plan, name="renew_plan"),
    # Health check
    path(f"{prefix}/ping/",ping, name="ping"),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

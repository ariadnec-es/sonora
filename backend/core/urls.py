from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from core import settings
from django.conf.urls.static import static
from sonoraAPI.views import ping

prefix = "api"

urlpatterns = [
    path('admin/', admin.site.urls),
    path(f'{prefix}/token/', TokenObtainPairView.as_view()),
    path(f'{prefix}/token/refresh/', TokenRefreshView.as_view()),
    path(f'{prefix}/sonora/v1/', include("sonoraAPI.urls")),
    # Checar se a API está ativa
    path(f'{prefix}/ping/', ping, name="ping"),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
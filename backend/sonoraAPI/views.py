from datetime import date
from typing import Any

from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response

from .models import Event, LinkEventMusic, Plan, PlanChoices, User, YoutubeMusic
from .serializers import (
    EventSerializer,
    LinkEventMusicSerializer,
    UserSerializer,
    YoutubeMusicSerializer,
)

# =========================================================
# BASE
# =========================================================


class BaseViewSet(viewsets.ModelViewSet):
    """
    Classe base com:
    - soft delete
    - filtros padrões
    - helpers de permissão
    """

    permission_classes = [permissions.IsAuthenticated]

    def default_filters(self):
        return {"is_active": True}

    def is_admin(self):
        return self.request.user.is_admin

    def is_manager(self):
        return self.request.user.is_manager

    def today(self):
        return date.today()

    def deny(self):
        self.permission_denied(self.request)

    def perform_destroy(self, instance):
        """
        Soft delete padrão
        """
        if not self.can_delete(instance):
            self.deny()

        instance.is_active = False
        instance.save()

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        filters = self.request.query_params.dict()
        safe_filters = {
            k: v
            for k, v in filters.items()
            if k not in ["page", "limit", "format", "managers"]
        }
        if safe_filters:
            try:
                queryset = queryset.filter(**safe_filters)
            except Exception:
                pass
        return queryset

    def can_delete(self, instance):
        """
        Pode ser sobrescrito nas subclasses
        """
        return self.is_admin()


# =========================================================
# USERS
# =========================================================


class UserViewSet(BaseViewSet):
    serializer_class = UserSerializer
    queryset = User.objects.none()

    def get_queryset(self):
        user = self.request.user

        if self.is_admin():
            if self.request.query_params.get("managers") == "true":
                return User.objects.filter(**self.default_filters(), is_manager=True)

            return User.objects.filter(**self.default_filters())

        return User.objects.filter(id=user.id, **self.default_filters())

    def create(self, request):
        """
        Apenas admin pode criar usuários
        """

        if not self.is_admin():
            self.deny()

        plan_name = self.request.data.get("plan", PlanChoices.EXPERIMENTACAO)

        if plan_name not in PlanChoices.values:
            raise ValueError("Plano inválido")

        plan = Plan.objects.create(name=plan_name)

        data = (
            self.request.data.copy()
            if hasattr(self.request.data, "copy")
            else dict(self.request.data)
        )

        if "plan" in data:
            del data["plan"]

        data["plan"] = plan

        password = data.pop("password", None)

        user = User.objects.create(**data)

        if password:
            if isinstance(password, list):
                password = password[0]
            user.set_password(password)
            user.save()

        return Response(UserSerializer(user).data)

    def can_delete(self, instance):
        return self.is_admin()


# =========================================================
# MUSICS
# =========================================================


class YoutubeMusicViewSet(BaseViewSet):
    serializer_class = YoutubeMusicSerializer
    queryset = YoutubeMusic.objects.none()

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
                Q(user=user) | Q(linkeventmusic__event_id__manager=user), is_active=True
            ).distinct()

        """
        Usuário comum:
        apenas próprias músicas
        """
        return YoutubeMusic.objects.filter(user=user, **base_filters)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

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


# =========================================================
# EVENTS
# =========================================================


class EventViewSet(BaseViewSet):
    serializer_class = EventSerializer
    queryset = Event.objects.none()

    def get_queryset(self):
        user = self.request.user

        base_filters = self.default_filters()

        if self.is_admin():
            return Event.objects.filter(**base_filters)

        if self.is_manager():
            return Event.objects.filter(
                manager=user, end_date__gte=self.today(), **base_filters
            )

        return Event.objects.none()

    def perform_create(self, serializer):
        user = self.request.user

        if not (self.is_admin() or self.is_manager()):
            self.deny()

        serializer.save(manager=user)

    def perform_update(self, serializer):
        instance = self.get_object()

        if self.is_admin():
            serializer.save()
            return

        if not self.is_manager():
            self.deny()

        if instance.manager != self.request.user:
            self.deny()

        if instance.end_date < self.today():
            self.deny()

        serializer.save()

    def can_delete(self, instance):
        user = self.request.user

        if self.is_admin():
            return True

        if not self.is_manager():
            return False

        if instance.manager != user:
            return False

        return instance.end_date >= self.today()


# =========================================================
# EVENT <-> MUSIC
# =========================================================


class LinkEventMusicViewSet(BaseViewSet):
    serializer_class = LinkEventMusicSerializer
    queryset = LinkEventMusic.objects.none()

    def get_queryset(self):
        user = self.request.user

        base_filters = self.default_filters()

        if self.is_admin():
            return LinkEventMusic.objects.filter(**base_filters)

        if self.is_manager():
            return LinkEventMusic.objects.filter(
                event_id__manager=user,
                event_id__end_date__gte=self.today(),
                **base_filters,
            )

        return LinkEventMusic.objects.none()

    def perform_create(self, serializer):
        user = self.request.user

        if not (self.is_admin() or self.is_manager()):
            self.deny()

        event = serializer.validated_data.get("event_id")
        music = serializer.validated_data.get("music_id")

        if not event:
            raise ValueError("Evento inválido")

        if not music:
            raise ValueError("Música inválida")

        if event.manager != user:
            self.deny()

        if not self.is_admin():
            """
            Manager só pode adicionar:
            - eventos dele
            - eventos ativos
            """

            if event.end_date < self.today():
                self.deny()

        serializer.save()

    def perform_update(self, serializer):
        instance = self.get_object()
        user = self.request.user

        if self.is_admin():
            serializer.save()
            return

        if not self.is_manager():
            self.deny()

        if instance.event_id.manager != user:
            self.deny()

        if instance.event_id.end_date < self.today():
            self.deny()

        serializer.save()

    def can_delete(self, instance):
        user = self.request.user

        if self.is_admin():
            return True

        if not self.is_manager():
            return False

        if instance.event_id.manager != user:
            return False

        return instance.event_id.end_date >= self.today()


# TODO: Implementar lógica de pagamento
@require_POST
def renew_plan(request):
    user = request.user

    if not user.is_authenticated:
        return JsonResponse({"error": "Usuário não autenticado"}, status=401)

    new_plan = request.POST.get("new_plan", "experimentacao")

    if new_plan not in PlanChoices.values:
        return JsonResponse({"error": "Plano inválido"}, status=400)

    user.plan = new_plan
    user.save()

    return JsonResponse(
        {"message": f"Plano de {user.username} atualizado para {user.plan}"}, status=200
    )


def ping(requests):
    """Verificação se servidor responde"""
    if not requests:
        return
    return JsonResponse({"message": "pong"}, safe=False)

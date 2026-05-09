from django.http import JsonResponse
from django.views.decorators.http import require_POST
from datetime import date
from rest_framework import viewsets
from rest_framework import status
from rest_framework import permissions 
from rest_framework.response import Response
from .models import User, YoutubeMusic, Event, LinkEventMusic, PlanChoices, Plan
from .serializers import (
    UserSerializer,
    YoutubeMusicSerializer,
    EventSerializer,
    LinkEventMusicSerializer,
)
from django.http import JsonResponse
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _default(self):
        return {
            "is_active": True,
        }

    def get_queryset(self):
        if self.request.user.is_admin:
            if self.request.query_params.get("managers", "false") == "true":
                filters = self._default() | {"is_manager": True}
                return User.objects.filter(**filters)
            return User.objects.filter(**self._default())
        return User.objects.filter(id=self.request.user.id)

    def perform_destroy(self, instance):
        if not self.request.user.is_admin:
            self.permission_denied(self.request)
        instance.is_active = False
        instance.save()

    def create(self, request, *args, **kwargs):
        if not request.user.is_admin:
            return Response([], status=403)
            
        data = request.data.copy()
        plan_name = data.pop("plan", None) 

        if plan_name is not None:
            if plan_name not in PlanChoices.values: 
                return Response({"error": f"Plano '{plan_name}' não existe."}, status=400)

        user = User.objects.create_user(**data) 

        if plan_name is not None:
            plan_obj = Plan.objects.create(name=plan_name)
            
            user.plan = plan_obj 
            user.save()

        return Response(self.serializer_class(user).data, status=201)


class YoutubeMusicViewSet(viewsets.ModelViewSet):
    serializer_class = YoutubeMusicSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = YoutubeMusic.objects.none()

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return YoutubeMusic.objects.all()
        return YoutubeMusic.objects.filter(user=user)

    def perform_destroy(self, instance):
        if self.request.user.is_admin or instance.user == self.request.user:
            instance.is_active = False
            instance.save()
        else:
            self.permission_denied(self.request)

    def create(self, request, *args, **kwargs):
        user = request.user
        data = request.data.copy() 
        data['user'] = user
        music = YoutubeMusic.objects.create(**data)
        return Response(self.serializer_class(music).data)

class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Event.objects.none()
    
    def get_queryset(self):
        user = self.request.user
        hoje = date.today()
        
        if user.is_admin:
            qs = Event.objects.all()
        elif user.is_manager:
            qs = Event.objects.filter(manager=user)
        else:
            return Event.objects.none()
        return qs.filter()

    def create(self, request, *args, **kwargs):
        user = request.user

        if not user.is_manager or not user.is_admin:
            return Response([], status=403)

        data = request.data.copy() 
        data['manager'] = user
        event = Event.objects.create(**data)
        return Response(self.serializer_class(event).data)


class LinkEventMusicViewSet(viewsets.ModelViewSet):
    serializer_class = LinkEventMusicSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = LinkEventMusic.objects.none()
    
    def get_queryset(self):
        user = self.request.user
        hoje = date.today()
        
        if user.is_admin:
            qs = LinkEventMusic.objects.all()
        elif user.is_manager:
            qs = LinkEventMusic.objects.filter(event_id__manager=user)
        else:
            return LinkEventMusic.objects.none()
        return qs.filter()

    def create(self, request, *args, **kwargs):
        user = request.user

        if not user.is_manager or not user.is_admin:
            return Response([], status=403)

        data = request.data.copy() 
        event_id = data.get("event") or data.get("event_id")

        event = Event.objects.filter(id=event_id).first()

        if not event:
            return JsonResponse({"error": "Evento não econtrado"}, safe=False)

        if event.manager != user:
            return JsonResponse({"error": f"{user.username} não é gerente do evento {event.event_name}"}, safe=False)

        music = get_object_or_404(YoutubeMusic, id=data.get("music") or data.get("music_id"))
        link = LinkEventMusic.objects.create(
            event_id=event,
            music_id=music
        )

        return Response(self.serializer_class(link).data)



# TODO: Lógica de pagamento
@require_POST
def renew_plan(request):
    user = request.user

    if not user.is_authenticated:
        return JsonResponse(
            {"error": "Usuário não autenticado"},
            status=401
        )

    new_plan = request.POST.get("new_plan", "experimentacao")

    if new_plan not in PlanChoices.choices:
        return JsonResponse(
            {"error": "Plano inválido"},
            status=400
        )

    user.plan = new_plan
    user.save()

    return JsonResponse(
        {
            "message": f"Plano de {user.username} atualizado para {user.plan}"
        },
        status=200
    )


def ping(requests):
    """Verificação se servidor responde"""
    if not requests:
        return
    return JsonResponse({"message": "pong"} , safe=False)

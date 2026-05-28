from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.decorators import action

from ..models import Plan, PlanChoices, User
from ..serializers.users import UserSerializer
from .base import BaseViewSet


class UserViewSet(BaseViewSet):
    serializer_class = UserSerializer
    queryset = User.objects.none()

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return super().get_permissions()

    @action(detail=False, methods=['get'])
    def me(self, request):
        return Response(UserSerializer(request.user).data)

    def get_queryset(self):
        user = self.request.user

        if self.is_admin():
            if self.request.query_params.get("managers") == "true":
                return User.objects.filter(**self.default_filters(), is_manager=True)

            return User.objects.filter(**self.default_filters())

        return User.objects.filter(id=user.id, **self.default_filters())

    def create(self, request):
        """
        Usuário comum pode se cadastrar.
        Apenas admin pode criar gerentes ou atribuir eventos.
        """
        if request.user.is_authenticated and not self.is_admin():
            self.deny()

        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)

        is_manager = data.pop("is_manager", False)
        is_admin = data.pop("is_admin", False)
        event_ids = data.pop("event_ids", [])

        if request.user.is_authenticated and self.is_admin():
            # Admin pode criar gerentes e definir event_ids
            data["is_manager"] = bool(is_manager)
            data["is_admin"] = bool(is_admin)
        else:
            # Usuário comum não pode se tornar gerente/admin
            data["is_manager"] = False
            data["is_admin"] = False
            event_ids = []

        plan_name = data.get("plan", PlanChoices.EXPERIMENTACAO)
        if plan_name not in PlanChoices.values:
            raise ValueError("Plano inválido")

        plan = Plan.objects.create(name=plan_name)
        data["plan"] = plan

        password = data.pop("password", None)

        user = User.objects.create(**data)

        if password:
            if isinstance(password, list):
                password = password[0]
            user.set_password(password)
            user.save()

        if event_ids and user.is_manager:
            from ..models import Event
            Event.objects.filter(id__in=event_ids).update(manager=user)

        return Response(UserSerializer(user).data)

    def can_delete(self, instance):
        return self.is_admin()

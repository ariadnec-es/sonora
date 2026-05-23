from rest_framework.response import Response
from ..models import User, Plan, PlanChoices
from ..serializers.users import UserSerializer
from .base import BaseViewSet

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

        body: dict = request.data
        plan_name = body.get("plan", PlanChoices.EXPERIMENTACAO)

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

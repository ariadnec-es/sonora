from django.http import JsonResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..models import Plan, PlanChoices

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def renew_plan(request):
    if request.user.plan.end_date > timezone.now():
        return Response(
            {"message": "Plano para este usuário ainda está vigente"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = request.user

    new_plan = request.data.get("new_plan", "experimentacao")

    if new_plan not in PlanChoices.values:
        return Response(
            {"error": "Plano inválido"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.plan = Plan.objects.create(name=new_plan)
    user.save()

    return Response(
        {"message": f"Plano de {user.username} atualizado para {user.plan.name}"},
        status=status.HTTP_200_OK,
    )


def ping(requests):
    """Checkhealt do servidor"""
    if not requests:
        return
    return JsonResponse({"message": "pong"}, safe=False)

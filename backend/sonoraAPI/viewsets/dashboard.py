from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import (
    Event,
    MusicCategory,
    MusicOrder,
    MusicStatus,
    PlanChoices,
    User,
    YoutubeMusic,
)


class DashboardMetricsView(APIView):
    """
    View para consolidar métricas e dados estatísticos voltados ao dashboard.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        now = timezone.now()

        # --- Métricas de Usuários e Planos ---
        total_users = User.objects.count()

        # Contagem de usuários por tipo de plano
        plan_counts = User.objects.values("plan__name").annotate(total=Count("id"))
        plans_distribution = {plan[0]: 0 for plan in PlanChoices.choices}
        for item in plan_counts:
            plan_name = item["plan__name"]
            if plan_name:
                plans_distribution[plan_name] = item["total"]

        # Planos ativos vs expirados (baseado na data de término do plano do usuário)
        active_plans = User.objects.filter(plan__end_date__gt=now).count()
        expired_plans = User.objects.filter(plan__end_date__lte=now).count()

        # --- Métricas de Eventos ---
        total_events = Event.objects.count()
        active_events = Event.objects.filter(is_active=True).count()
        inactive_events = total_events - active_events

        # --- Métricas de Músicas e Pedidos ---
        total_uploaded_musics = YoutubeMusic.objects.count()
        total_orders = MusicOrder.objects.count()

        # Distribuição de pedidos por status
        status_counts = MusicOrder.objects.values("status").annotate(total=Count("id"))
        status_distribution = {
            status_choice[0]: 0 for status_choice in MusicStatus.choices
        }
        for item in status_counts:
            status_distribution[item["status"]] = item["total"]

        # Distribuição de pedidos por categoria (Reações / Fundo)
        category_counts = MusicOrder.objects.values("category").annotate(
            total=Count("id")
        )
        category_distribution = {
            cat_choice[0]: 0 for cat_choice in MusicCategory.choices
        }
        for item in category_counts:
            category_distribution[item["category"]] = item["total"]

        # --- Resumo de Eventos Ativos com mais Pedidos ---
        # Traz uma lista rápida dos eventos ativos e a quantidade de músicas pedidas neles
        top_events_qs = (
            Event.objects.filter(is_active=True)
            .annotate(
                total_orders=Count(
                    "folders__music_orders",
                    filter=Q(folders__music_orders__is_active=True),
                )
            )
            .order_by("-total_orders")[:5]
        )

        top_events = [
            {
                "id": str(event.id),
                "event_name": event.event_name,
                "total_orders": event.total_orders,
                "start_date": event.start_date,
                "end_date": event.end_date,
            }
            for event in top_events_qs
        ]

        # Montagem do dicionário de resposta
        dashboard_data = {
            "users_and_plans": {
                "total_users": total_users,
                "active_plans": active_plans,
                "expired_plans": expired_plans,
                "distribution": plans_distribution,
            },
            "events": {
                "total_events": total_events,
                "active_events": active_events,
                "inactive_events": inactive_events,
                "top_active_events_by_orders": top_events,
            },
            "musics_and_orders": {
                "total_uploaded_musics": total_uploaded_musics,
                "total_orders": total_orders,
                "status_distribution": status_distribution,
                "category_distribution": category_distribution,
            },
        }

        return Response(dashboard_data, status=status.HTTP_200_OK)

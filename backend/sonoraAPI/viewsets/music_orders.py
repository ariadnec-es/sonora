from django.db import transaction
from django.db.models import F
from rest_framework import permissions
from rest_framework.exceptions import ValidationError

from ..models import MusicOrder
from ..serializers.music_orders import MusicOrderSerializer
from .base import BaseViewSet


class MusicOrderViewSet(BaseViewSet):
    serializer_class = MusicOrderSerializer
    queryset = MusicOrder.objects.none()

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        base_filters = self.default_filters()

        if self.is_admin():
            return MusicOrder.objects.filter(**base_filters)

        if self.is_manager():
            return MusicOrder.objects.filter(event__manager=user, **base_filters)

        if user.is_authenticated:
            return MusicOrder.objects.filter(music__user=user, **base_filters)

        return MusicOrder.objects.none()

    def _handle_reordering(self, event, order, exclude_id=None):
        """
        US08/US09: Se a ordem já existir, desloca as demais para frente.
        """
        with transaction.atomic():
            conflicting = MusicOrder.objects.filter(event=event, order=order)
            if exclude_id:
                conflicting = conflicting.exclude(id=exclude_id)
            
            if conflicting.exists():
                # Desloca todas as músicas a partir desta ordem para frente
                to_shift = MusicOrder.objects.filter(event=event, order__gte=order)
                if exclude_id:
                    to_shift = to_shift.exclude(id=exclude_id)
                
                # Para evitar conflitos de UniqueConstraint durante o update no SQLite,
                # as vezes é necessário processar um a um ou usar valores temporários.
                # Como o limite é pequeno (30 músicas), vamos iterar de trás para frente.
                items = list(to_shift.order_by('-order'))
                for item in items:
                    item.order += 1
                    item.save()

    def perform_create(self, serializer):
        user = self.request.user
        event = serializer.validated_data["event"]
        music = serializer.validated_data["music"]
        order = serializer.validated_data["order"]

        if not user.is_authenticated:
            if not event.is_active or event.end_date < self.today():
                raise ValidationError({"event": "Evento inativo ou expirado."})
            self._handle_reordering(event, order)
            serializer.save()
            return

        if self.is_admin():
            self._handle_reordering(event, order)
            serializer.save()
            return

        if not self.is_manager():
            if not event.is_active or event.end_date < self.today():
                raise ValidationError({"event": "Evento inativo ou expirado."})
            self._handle_reordering(event, order)
            serializer.save()
            return

        if event.manager != user:
            self.deny()

        if event.end_date < self.today():
            raise ValidationError(
                {"event": "Não é possível adicionar músicas a um evento finalizado."}
            )

        # Manager pode adicionar qualquer música ao seu evento (ajuste US08)
        self._handle_reordering(event, order)
        serializer.save()

    def perform_update(self, serializer):
        instance = self.get_object()
        user = self.request.user
        event = serializer.validated_data.get("event", instance.event)
        order = serializer.validated_data.get("order", instance.order)

        if self.is_admin():
            if order != instance.order or event != instance.event:
                self._handle_reordering(event, order, exclude_id=instance.id)
            serializer.save()
            return

        if not self.is_manager():
            self.deny()

        if instance.event.manager != user or event.manager != user:
            self.deny()

        if event.end_date < self.today():
            raise ValidationError(
                {
                    "event": "O evento já foi finalizado, não é possível alterar as músicas."
                }
            )

        if order != instance.order or event != instance.event:
            self._handle_reordering(event, order, exclude_id=instance.id)

        serializer.save()

    def can_delete(self, instance):
        user = self.request.user

        if self.is_admin():
            return True

        if not self.is_manager():
            return False

        if instance.event.manager != user:
            return False

        if instance.event.end_date < self.today():
            return False  # Impede deletar músicas de histórico de eventos passados

        return True

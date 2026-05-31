from django.db import transaction
from django.db.models import F
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from ..models import MusicOrder, MusicStatus
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

    def _handle_reordering(self, event, new_order, instance_id=None):
        """
        US08/US09: Abre espaço para a nova ordem deslocando os itens existentes.
        """
        with transaction.atomic():
            # Se for um item existente sendo movido, pegamos sua ordem atual
            old_order = None
            if instance_id:
                try:
                    mo = MusicOrder.objects.get(id=instance_id)
                    old_order = mo.order
                    # Movemos o item atual temporariamente para o final para não atrapalhar o shift
                    MusicOrder.objects.filter(id=instance_id).update(order=1000)
                except MusicOrder.DoesNotExist:
                    pass

            if old_order == new_order:
                # Se old_order existia e é igual, voltamos o valor (no perform_update)
                return

            if old_order is None:
                # Criação: Desloca todos a partir de new_order para frente
                to_shift = MusicOrder.objects.filter(
                    event=event, is_active=True, order__gte=new_order
                ).order_by('-order')
                for item in to_shift:
                    MusicOrder.objects.filter(id=item.id).update(order=item.order + 1)
            else:
                if new_order < old_order:
                    # Moveu para cima: Desloca itens entre new_order e old_order-1 para frente
                    to_shift = MusicOrder.objects.filter(
                        event=event, is_active=True, 
                        order__gte=new_order, order__lt=old_order
                    ).order_by('-order')
                    for item in to_shift:
                        MusicOrder.objects.filter(id=item.id).update(order=item.order + 1)
                else:
                    # Moveu para baixo: Desloca itens entre old_order+1 e new_order para trás
                    to_shift = MusicOrder.objects.filter(
                        event=event, is_active=True,
                        order__gt=old_order, order__lte=new_order
                    ).order_by('order')
                    for item in to_shift:
                        MusicOrder.objects.filter(id=item.id).update(order=item.order - 1)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        instance = self.get_object()
        if not self.can_delete(instance): # Manager do evento ou Admin
            self.deny()
        
        instance.status = MusicStatus.ACCEPTED
        instance.save()
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        instance = self.get_object()
        if not self.can_delete(instance): # Manager do evento ou Admin
            self.deny()
        
        instance.status = MusicStatus.REJECTED
        # Mantemos is_active=True para que o status "Rejeitada" persista na listagem
        instance.save()
        return Response(self.get_serializer(instance).data)

    def perform_create(self, serializer):
        user = self.request.user
        event = serializer.validated_data["event"]
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

        self._handle_reordering(event, order)
        serializer.save()

    def perform_update(self, serializer):
        instance = self.get_object()
        user = self.request.user
        event = serializer.validated_data.get("event", instance.event)
        order = serializer.validated_data.get("order", instance.order)

        if self.is_admin():
            if order != instance.order or event != instance.event:
                self._handle_reordering(event, order, instance_id=instance.id)
            serializer.save()
            return

        # Verifica se o evento de destino é válido (apenas para não-admins)
        if event.end_date < self.today():
            raise ValidationError(
                {"event": "O evento já foi finalizado, não é possível alterar as músicas."}
            )

        # Regras de permissão para Manager e Cliente
        can_edit = False
        if self.is_manager():
            # Manager pode editar se for o gerente tanto do evento atual quanto do novo
            if instance.event.manager == user and event.manager == user:
                can_edit = True
        
        # Cliente pode editar se for o dono da música vinculada
        if not can_edit and instance.music.user == user:
            can_edit = True

        if not can_edit:
            self.deny()

        if order != instance.order or event != instance.event:
            self._handle_reordering(event, order, instance_id=instance.id)

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

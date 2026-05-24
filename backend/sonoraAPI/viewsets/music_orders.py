from rest_framework.exceptions import ValidationError

from ..models import MusicOrder
from ..serializers.music_orders import MusicOrderSerializer
from .base import BaseViewSet


class MusicOrderViewSet(BaseViewSet):
    serializer_class = MusicOrderSerializer
    queryset = MusicOrder.objects.none()

    def get_queryset(self):
        user = self.request.user
        base_filters = self.default_filters()  # Usa o is_active=True do BaseViewSet

        if self.is_admin():
            return MusicOrder.objects.filter(**base_filters)

        if self.is_manager():
            # Manager vê apenas as ligações de músicas dos eventos DELE
            return MusicOrder.objects.filter(event__manager=user, **base_filters)

        # Usuários comuns não gerenciam ordem de músicas de eventos
        return MusicOrder.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        event = serializer.validated_data["event"]
        music = serializer.validated_data["music"]

        if self.is_admin():
            serializer.save()
            return

        if not self.is_manager():
            self.deny()

        # Regra 1: Manager deve ser o dono do evento
        if event.manager != user:
            self.deny()

        # Regra 2: Evento não pode estar expirado
        if event.end_date < self.today():
            raise ValidationError(
                {"event": "Não é possível adicionar músicas a um evento finalizado."}
            )

        # TODO: Corrigir para: manager (gerente) pode adicionar musicas mesmo ele mesmo não
        # as enviando
        # Regra 3: O manager só pode adicionar músicas que pertencem a ele
        if music.user != user:
            raise ValidationError(
                {
                    "music": "Você só pode adicionar as suas próprias músicas neste evento."
                }
            )

        serializer.save()

    def perform_update(self, serializer):
        instance = self.get_object()
        user = self.request.user
        # Se tentarem trocar o evento na atualização, pegamos o novo. Se não, mantém o atual.
        event = serializer.validated_data.get("event", instance.event)

        if self.is_admin():
            serializer.save()
            return

        if not self.is_manager():
            self.deny()

        # Garante que ele é dono do evento atual e do novo evento (caso tente trocar)
        if instance.event.manager != user or event.manager != user:
            self.deny()

        # Garante que o evento ainda não expirou
        if event.end_date < self.today():
            raise ValidationError(
                {
                    "event": "O evento já foi finalizado, não é possível alterar as músicas."
                }
            )

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

from ..models import Event
from ..serializers.events import EventSerializer
from .base import BaseViewSet

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

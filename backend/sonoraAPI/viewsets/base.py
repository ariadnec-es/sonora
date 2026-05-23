from datetime import date
from rest_framework import permissions, viewsets
from ..permissions import HasValidPlanPermission

class BaseViewSet(viewsets.ModelViewSet):
    """
    Classe base com:
    - soft delete
    - filtros padrões
    - helpers de permissão
    """

    permission_classes = [permissions.IsAuthenticated, HasValidPlanPermission]

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

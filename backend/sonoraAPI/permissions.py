from rest_framework import permissions
from django.utils import timezone 

# admin, user, manager
# 
class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.is_staff or request.user.is_admin:
            return True
        return request.method in permissions.SAFE_METHODS


class HasValidPlanPermission(permissions.BasePermission):
    message = "Você precisa de um plano ativo para acessar este recurso."

    def has_permission(self, request, view):
        # 1. Se o usuário não estiver autenticado, deixa o IsAuthenticated cuidar
        if not request.user or not request.user.is_authenticated:
            return True 

        # 2. Verifica se a View inteira foi marcada como EXCEÇÃO
        if getattr(view, 'exempt_plan_verification', False):
            return True

        # 3. Verifica se apenas a AÇÃO atual foi marcada como EXCEÇÃO
        # Ex: action pode ser 'list', 'retrieve', 'create', etc.
        exempt_actions = getattr(view, 'exempt_plan_actions', [])
        if view.action in exempt_actions:
            return True

        # 4. Regra Principal: O usuário tem plano válido?
        user_plan = request.user.plan # Assumindo que seja uma ForeignKey
        if user_plan and user_plan.end_date >= timezone.now():
            return True

        # Se não caiu em nenhuma exceção e não tem plano válido, BLOQUEIA.
        return False

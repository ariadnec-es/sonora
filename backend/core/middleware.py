from django.http import JsonResponse

from sonoraAPI.models import timezone


class MiddleWare:
    def __init__(self, get_response):
        self.get_response = get_response
        self.free_routes = ["/api/sonora/v1/renew_plan/", "/api/sonora/v1/token/",]

    def __call__(self, request):


        if request.user.is_authenticated:
            if request.path in self.free_routes:
                return self.get_response(request)

            if request.user.is_superuser or request.user.is_admin:
                return self.get_response(request)

            plan = getattr(request.user, "plan", None)
            if plan and plan.end_date is not None:
                if plan.end_date < timezone.now():
                    return JsonResponse(
                        {"message": "Você não possui um plano ativo ou ele expirou."},
                        status=401,
                    )

        response = self.get_response(request)
        return response

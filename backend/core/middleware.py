from django.http import HttpResponse, JsonResponse

from sonoraAPI.models import timezone


class MiddleWare:
    def __init__(self, get_response):
        self.get_response = get_response
        self.free_routes = ["/api/sonora/v1/renew_plan/", "/api/sonora/v1/token/",]

    def __call__(self, request):

        if request.method == "OPTIONS":
            response = HttpResponse()
            response["Access-Control-Allow-Origin"] = "*"
            response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            response["Access-Control-Allow-Headers"] = "Authorization, Content-Type, X-Requested-With"
            response["Access-Control-Allow-Credentials"] = "true"
            return response

        if request.user.is_authenticated:
            if request.path in self.free_routes:
                response = self.get_response(request)
                self._set_cors_headers(response)
                return response

            if request.user.is_superuser or request.user.is_admin:
                response = self.get_response(request)
                self._set_cors_headers(response)
                return response

            plan = getattr(request.user, "plan", None)
            if plan and plan.end_date is not None:
                if plan.end_date < timezone.now():
                    response = JsonResponse(
                        {"message": "Você não possui um plano ativo ou ele expirou."},
                        status=401,
                    )
                    self._set_cors_headers(response)
                    return response

        response = self.get_response(request)
        self._set_cors_headers(response)
        return response

    def _set_cors_headers(self, response):
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Authorization, Content-Type, X-Requested-With"
        response["Access-Control-Allow-Credentials"] = "true"
        return response

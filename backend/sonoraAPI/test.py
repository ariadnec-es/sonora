from datetime import timedelta
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from .models import User, Plan, PlanChoices, Event, YoutubeMusic, MusicOrder


class BaseTestSetup(APITestCase):
    def setUp(self):
        self.client = APIClient()

        # Criação de usuários
        self.admin_user = User.objects.create_user(
            username="admin", password="password123", is_admin=True
        )
        self.manager_user = User.objects.create_user(
            username="manager", password="password123", is_manager=True
        )
        self.normal_user = User.objects.create_user(
            username="normal", password="password123"
        )

    def expire_user_plan(self, user):
        """Expira o plano no banco de dados viajando no tempo"""
        Plan.objects.filter(id=user.plan.id).update(
            end_date=timezone.now() - timedelta(days=1)
        )
        user.refresh_from_db()

    def authenticate(self, user):
        """
        Hack para testes:
        Autentica no Django (para o Middleware) E no DRF (para as Views)
        """
        self.client.force_login(user=user)
        self.client.force_authenticate(user=user)


# =========================================================
# TESTES DE PLANO E MIDDLEWARE
# =========================================================
class TestPlanMiddlewareAndRenewal(BaseTestSetup):
    def test_active_plan_allows_access(self):
        self.authenticate(self.normal_user)
        response = self.client.get("/api/sonora/v1/users/")
        self.assertNotEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_expired_plan_blocks_access(self):
        self.authenticate(self.normal_user)
        self.expire_user_plan(self.normal_user)

        response = self.client.get("/api/sonora/v1/users/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(
            response.json()["message"], "Você não possui um plano ativo ou ele expirou."
        )

    def test_expired_plan_can_access_free_routes(self):
        self.authenticate(self.normal_user)
        self.expire_user_plan(self.normal_user)

        # Sem format='json' pois a view do Django puro espera form data padrão (request.POST)
        response = self.client.post(
            "/api/sonora/renew_plan/", {"new_plan": PlanChoices.MENSAL}
        )
        self.assertNotEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_full_cycle_expiration_and_renewal(self):
        self.authenticate(self.normal_user)

        # 1. Acesso normal (Ping)
        self.assertEqual(
            self.client.get("/api/sonora/ping/").status_code, status.HTTP_200_OK
        )

        # 2. Plano expira
        self.expire_user_plan(self.normal_user)

        # 3. Tenta acessar rota e falha
        self.assertEqual(
            self.client.get("/api/sonora/ping/").status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

        # 4. Renova o plano
        self.client.post("/api/sonora/renew_plan/", {"new_plan": PlanChoices.ANUAL})
        self.normal_user.refresh_from_db()

        # 5. Volta a acessar normalmente
        self.assertEqual(
            self.client.get("/api/sonora/ping/").status_code, status.HTTP_200_OK
        )


# =========================================================
# TESTES DE PERMISSÕES NAS VIEWS
# =========================================================
class TestViewPermissions(BaseTestSetup):
    def test_only_admin_can_create_user(self):
        payload = {
            "username": "new_user",
            "password": "123",
            "plan": PlanChoices.MENSAL,
        }

        self.authenticate(self.normal_user)
        response = self.client.post("/api/sonora/v1/users/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.authenticate(self.admin_user)
        response = self.client.post("/api/sonora/v1/users/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_event_creation_permissions(self):
        payload = {
            "event_name": "Festa",
            "start_date": timezone.now().date(),
            "end_date": (timezone.now() + timedelta(days=2)).date(),
        }

        self.authenticate(self.normal_user)
        response = self.client.post("/api/sonora/v1/events/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.authenticate(self.manager_user)
        response = self.client.post("/api/sonora/v1/events/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_music_order_rules(self):
        event = Event.objects.create(
            event_name="Casamento",
            manager=self.manager_user,
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=1)).date(),
        )
        music = YoutubeMusic.objects.create(
            name="Musica 1", url="http://youtube.com/1", user=self.manager_user
        )
        music_wrong_owner = YoutubeMusic.objects.create(
            name="Musica 2", url="http://youtube.com/2", user=self.normal_user
        )

        self.authenticate(self.manager_user)

        payload_wrong_music = {
            "event": event.id,
            "music": music_wrong_owner.id,
            "order": 1,
        }
        response = self.client.post(
            "/api/sonora/v1/music-order/", payload_wrong_music, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        payload_correct = {"event": event.id, "music": music.id, "order": 1}
        response = self.client.post(
            "/api/sonora/v1/music-order/", payload_correct, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_cannot_modify_expired_event(self):
        expired_event = Event.objects.create(
            event_name="Formatura",
            manager=self.manager_user,
            start_date=(timezone.now() - timedelta(days=5)).date(),
            end_date=(timezone.now() - timedelta(days=1)).date(),
        )
        music = YoutubeMusic.objects.create(
            name="Musica 1", url="http://youtube.com/1", user=self.manager_user
        )

        self.authenticate(self.manager_user)

        payload = {"event": expired_event.id, "music": music.id, "order": 1}
        response = self.client.post(
            "/api/sonora/v1/music-order/", payload, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

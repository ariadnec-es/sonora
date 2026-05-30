from rest_framework_simplejwt.views import TokenObtainPairView

from ..serializers.token import EmailOrUsernameTokenObtainPairSerializer


class EmailOrUsernameTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailOrUsernameTokenObtainPairSerializer

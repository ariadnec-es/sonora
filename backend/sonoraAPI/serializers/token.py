from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from ..models import User


class EmailOrUsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Permite autenticar utilizando e-mail ou nome de usuário.
    """

    def validate(self, attrs):
        identifier = attrs.get("username")
        if identifier and "@" in identifier:
            try:
                user = User.objects.get(email__iexact=identifier)
                attrs["username"] = user.username
            except User.DoesNotExist:
                pass

        return super().validate(attrs)

from .base import BaseViewSet
from ..models import Folder
from ..serializers.folders import FolderSerializer
from rest_framework import permissions

class FolderViewSet(BaseViewSet):
    serializer_class = FolderSerializer
    queryset = Folder.objects.none()

    def get_queryset(self):
        user = self.request.user
        
        if self.is_admin():
            return Folder.objects.all()
        
        if self.is_manager():
            return Folder.objects.filter(event__manager=user)
        
        return Folder.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        event = serializer.validated_data["event"]
        
        if not self.is_admin() and event.manager != user:
            self.deny()
            
        serializer.save()

    def can_delete(self, instance):
        if self.is_admin():
            return True
        return instance.event.manager == self.request.user

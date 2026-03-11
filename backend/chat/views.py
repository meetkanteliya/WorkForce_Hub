from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import ChatMessage, CompanyChatMessage
from .serializers import (
    ChatMessageSerializer,
    CompanyChatMessageSerializer,
    ChatEmployeePublicSerializer,
)

class ChatMessageListView(generics.ListAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        department_id = self.request.query_params.get('department')
        if not department_id:
            return ChatMessage.objects.none()
        
        # Security: ensure user has access to this department
        user = self.request.user
        if user.role not in ['admin', 'hr']:
            try:
                emp = getattr(user, 'employee', None)
                if not emp or str(emp.department_id) != str(department_id):
                    return ChatMessage.objects.none()
            except Exception:
                return ChatMessage.objects.none()
                
        # Return recent messages, e.g. last 100
        return ChatMessage.objects.filter(department_id=department_id).order_by('timestamp')[:100]


User = get_user_model()


class CompanyChatMembersView(generics.ListAPIView):
    serializer_class = ChatEmployeePublicSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        # "Active employees" = active user accounts that have an Employee profile.
        # If you want admins/hr without Employee to also appear, remove the `employee__isnull=False` filter.
        return User.objects.filter(is_active=True, employee__isnull=False).select_related("employee").order_by("username")


class CompanyChatMessageListCreateView(generics.ListCreateAPIView):
    serializer_class = CompanyChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = None

    def get_queryset(self):
        # Last 100 messages, oldest->newest (UI can render naturally)
        return CompanyChatMessage.objects.select_related("sender").order_by("-created_at")[:100][::-1]

    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_active or not hasattr(user, "employee"):
            raise PermissionDenied("Inactive or non-employee accounts cannot use company chat.")

        msg = serializer.save(sender=user)

        channel_layer = get_channel_layer()
        payload = CompanyChatMessageSerializer(msg, context={"request": self.request}).data
        async_to_sync(channel_layer.group_send)(
            "company_chat",
            {"type": "company_chat_message", "payload": payload},
        )

    def create(self, request, *args, **kwargs):
        # Support file uploads + optional text content.
        # `content` can be blank if attachment exists.
        return super().create(request, *args, **kwargs)

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response

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
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        qs = CompanyChatMessage.objects.select_related("sender", "deleted_by").order_by("-created_at")
        q = (self.request.query_params.get("q") or "").strip()
        if q:
            from django.db.models import Q
            qs = qs.filter(Q(content__icontains=q) | Q(attachment_name__icontains=q) | Q(sender__username__icontains=q))
        return qs

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

    def list(self, request, *args, **kwargs):
        # Return newest-first for efficient pagination; frontend reverses for display.
        return super().list(request, *args, **kwargs)


class CompanyChatMessageDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = CompanyChatMessage.objects.select_related("sender", "deleted_by")

    def destroy(self, request, *args, **kwargs):
        msg = self.get_object()
        user = request.user
        if not user.is_active or not hasattr(user, "employee"):
            raise PermissionDenied("Inactive or non-employee accounts cannot use company chat.")

        is_admin_hr = getattr(user, "role", None) in ("admin", "hr")
        is_sender = msg.sender_id == user.id
        if not (is_admin_hr or is_sender):
            raise PermissionDenied("You cannot delete this message.")

        msg.soft_delete(actor=user, reason="deleted")

        channel_layer = get_channel_layer()
        payload = CompanyChatMessageSerializer(msg, context={"request": request}).data
        async_to_sync(channel_layer.group_send)(
            "company_chat",
            {"type": "company_message_deleted", "payload": payload},
        )
        return Response(status=204)


class CompanyChatMarkReadView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        from .models import CompanyChatMessageRead
        user = request.user
        if not user.is_active or not hasattr(user, "employee"):
            raise PermissionDenied("Inactive or non-employee accounts cannot use company chat.")

        up_to_id = request.data.get("up_to_id")
        message_ids = request.data.get("message_ids")

        qs = CompanyChatMessage.objects.all()
        if up_to_id:
            qs = qs.filter(id__lte=up_to_id)
        elif message_ids:
            qs = qs.filter(id__in=message_ids)
        else:
            return Response({"detail": "Provide up_to_id or message_ids."}, status=400)

        qs = qs.exclude(sender_id=user.id)

        existing = set(
            CompanyChatMessageRead.objects.filter(user_id=user.id, message_id__in=qs.values_list("id", flat=True))
            .values_list("message_id", flat=True)
        )
        to_create = [
            CompanyChatMessageRead(user_id=user.id, message_id=mid)
            for mid in qs.values_list("id", flat=True)
            if mid not in existing
        ]
        CompanyChatMessageRead.objects.bulk_create(to_create, ignore_conflicts=True)

        if up_to_id:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                "company_chat",
                {
                    "type": "company_read_receipt",
                    "payload": {"user_id": user.id, "up_to_id": int(up_to_id)},
                },
            )

        return Response({"marked": len(to_create)})

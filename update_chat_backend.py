import re

# 1. Update consumers.py
with open("backend/chat/consumers.py", "r", encoding="utf-8") as f:
    consumers_code = f.read()

consumers_code = re.sub(
    r'        if not await self\.is_user_active\(self\.user\.id\) or not await self\.has_employee_profile\(self\.user\.id\):\n            await self\.close\(\)\n            return',
    '',
    consumers_code
)

connect_replace = """        self.user = user
        self.full_name = await self.get_full_name(self.user.id)

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        logger.debug(f"CompanyChatConsumer connected: {user.username}")

        # Broadcast join presence
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "company_presence",
                "event": "join",
                "user_id": self.user.id,
                "full_name": self.full_name,
            },
        )"""

consumers_code = re.sub(
    r'        self\.user = user\n\n        await self\.channel_layer\.group_add.*?full_name": await self\.get_full_name\(self\.user\.id\),\n            \},\n        \)',
    connect_replace,
    consumers_code,
    flags=re.DOTALL
)

disconnect_replace = """    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        if getattr(self, "user", None):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "company_presence",
                    "event": "leave",
                    "user_id": self.user.id,
                    "full_name": getattr(self, "full_name", ""),
                },
            )"""

consumers_code = re.sub(
    r'    async def disconnect\(self, close_code\):.*?full_name": await self\.get_full_name\(self\.user\.id\),\n                \},\n            \)',
    disconnect_replace,
    consumers_code,
    flags=re.DOTALL
)

receive_typing_replace = """        if event_type == "typing":
            is_typing = bool(data.get("is_typing"))
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "company_typing",
                    "user_id": self.user.id,
                    "full_name": getattr(self, "full_name", ""),
                    "is_typing": is_typing,
                },
            )
            return"""

consumers_code = re.sub(
    r'        if event_type == "typing":.*?is_typing": is_typing,\n                \},\n            \)\n            return',
    receive_typing_replace,
    consumers_code,
    flags=re.DOTALL
)

with open("backend/chat/consumers.py", "w", encoding="utf-8") as f:
    f.write(consumers_code)

# 2. Update views.py
with open("backend/chat/views.py", "r", encoding="utf-8") as f:
    views_code = f.read()

get_qs_replace = """    def get_queryset(self):
        qs = CompanyChatMessage.objects.select_related("sender", "deleted_by").order_by("-created_at")
        
        since_id = self.request.query_params.get("since_id")
        if since_id and since_id.isdigit():
            qs = qs.filter(id__gt=int(since_id))

        q = (self.request.query_params.get("q") or "").strip()
        if q:
            from django.db.models import Q
            qs = qs.filter(Q(content__icontains=q) | Q(attachment_name__icontains=q) | Q(sender__username__icontains=q))
        return qs"""

views_code = re.sub(
    r'    def get_queryset\(self\):\n        qs = CompanyChatMessage\.objects\.select_related\("sender", "deleted_by"\)\.order_by\("-created_at"\)\n        q = \(self\.request\.query_params\.get\("q"\) or ""\)\.strip\(\)\n        if q:\n            from django\.db\.models import Q\n            qs = qs\.filter\(Q\(content__icontains=q\) \| Q\(attachment_name__icontains=q\) \| Q\(sender__username__icontains=q\)\)\n        return qs',
    get_qs_replace,
    views_code
)

with open("backend/chat/views.py", "w", encoding="utf-8") as f:
    f.write(views_code)

# 3. Update serializers.py
with open("backend/chat/serializers.py", "r", encoding="utf-8") as f:
    serializers_code = f.read()

import_replace = """from rest_framework import serializers
from django.core.validators import FileExtensionValidator
import os

ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'pdf', 'docx', 'xlsx', 'txt', 'csv']"""

serializers_code = serializers_code.replace("from rest_framework import serializers", import_replace)

file_validation = """class CompanyChatMessageSerializer(serializers.ModelSerializer):
    attachment = serializers.FileField(
        write_only=True, 
        required=False,
        validators=[FileExtensionValidator(allowed_extensions=ALLOWED_EXTENSIONS)]
    )"""

serializers_code = serializers_code.replace("class CompanyChatMessageSerializer(serializers.ModelSerializer):\n    attachment = serializers.FileField(write_only=True, required=False)", file_validation)

validate_replace = """    def validate(self, data):
        content = (data.get("content") or "").strip()
        attachment = data.get("attachment")
        
        if attachment:
            if attachment.size > 5 * 1024 * 1024:
                raise serializers.ValidationError({"attachment": "File size cannot exceed 5MB."})

        if not content and not attachment:
            raise serializers.ValidationError("Message must contain either text content or an attachment.")

        return data"""

serializers_code = re.sub(
    r'    def validate\(self, data\):\n        content = \(data\.get\("content"\) or ""\)\.strip\(\)\n        attachment = data\.get\("attachment"\)\n        if not content and not attachment:\n            raise serializers\.ValidationError\(\n                "Message must contain either text content or an attachment\."\n            \)\n        return data',
    validate_replace,
    serializers_code
)

with open("backend/chat/serializers.py", "w", encoding="utf-8") as f:
    f.write(serializers_code)

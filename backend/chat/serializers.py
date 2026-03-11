from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ChatMessage, CompanyChatMessage

class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    # Using SerializerMethodField for profile picture to handle possible nulls safely
    sender_profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = ['id', 'department', 'sender', 'sender_name', 'sender_profile_picture', 'content', 'timestamp', 'read_by']
        read_only_fields = ['sender', 'timestamp', 'read_by']

    def get_sender_profile_picture(self, obj):
        try:
            return obj.sender.employee.profile_picture.url if obj.sender.employee.profile_picture else None
        except Exception:
            return None


User = get_user_model()


class ChatEmployeePublicSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "full_name", "profile_picture", "is_active")

    def get_full_name(self, obj):
        name = (obj.get_full_name() or "").strip()
        return name or obj.username

    def get_profile_picture(self, obj):
        try:
            return obj.employee.profile_picture.url if obj.employee.profile_picture else None
        except Exception:
            return None


class CompanyChatMessageSerializer(serializers.ModelSerializer):
    sender = ChatEmployeePublicSerializer(read_only=True)
    timestamp = serializers.DateTimeField(source="created_at", read_only=True)
    attachment_url = serializers.SerializerMethodField()
    attachment = serializers.FileField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = CompanyChatMessage
        fields = (
            "id",
            "sender",
            "content",
            "timestamp",
            "attachment",
            "attachment_url",
            "attachment_name",
            "attachment_mime",
        )

    def get_attachment_url(self, obj):
        try:
            return obj.attachment.url if obj.attachment else None
        except Exception:
            return None

    def validate(self, attrs):
        content = (attrs.get("content") or "").strip()
        attachment = attrs.get("attachment", None)
        if not content and not attachment:
            raise serializers.ValidationError("Message must include text content or an attachment.")
        return attrs

    def create(self, validated_data):
        attachment = validated_data.get("attachment", None)
        if attachment:
            validated_data["attachment_name"] = validated_data.get("attachment_name") or getattr(attachment, "name", "") or ""
            validated_data["attachment_mime"] = validated_data.get("attachment_mime") or getattr(attachment, "content_type", "") or ""
        return super().create(validated_data)

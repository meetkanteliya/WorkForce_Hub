from rest_framework import serializers
from django.core.validators import FileExtensionValidator
import os

ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'pdf', 'docx', 'xlsx', 'txt', 'csv']
from django.contrib.auth import get_user_model
from .models import ChatMessage, CompanyChatMessage, CompanyChatMessageRead, CompanyChatMessageReaction

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
        fields = ("id", "username", "role", "full_name", "profile_picture", "is_active")

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
    attachment = serializers.FileField(
        write_only=True, 
        required=False, 
        allow_null=True,
        validators=[FileExtensionValidator(allowed_extensions=ALLOWED_EXTENSIONS)]
    )
    reply_to_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    reply_to = serializers.SerializerMethodField()
    is_deleted = serializers.BooleanField(read_only=True)
    deleted_at = serializers.DateTimeField(read_only=True)
    deleted_by = ChatEmployeePublicSerializer(read_only=True)
    read_by_count = serializers.SerializerMethodField()
    reactions = serializers.SerializerMethodField()
    temp_id = serializers.CharField(read_only=True, required=False, allow_null=True)

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
            "is_deleted",
            "deleted_at",
            "deleted_by",
            "read_by_count",
            "reactions",
            "reply_to",
            "reply_to_id",
            "temp_id",
        )

    def get_attachment_url(self, obj):
        try:
            return obj.attachment.url if obj.attachment else None
        except Exception:
            return None

    def get_reply_to(self, obj):
        if not obj.reply_to_id:
            return None
        # Return basic info to avoid deep nesting
        reply = obj.reply_to
        if not reply: return None
        return {
            "id": reply.id,
            "sender": {
                "id": reply.sender_id,
                "username": reply.sender.username,
                "full_name": reply.sender.get_full_name() or reply.sender.username,
            },
            "content": reply.content if not reply.is_deleted else "",
            "is_deleted": reply.is_deleted,
        }

    def validate(self, attrs):
        content = (attrs.get("content") or "").strip()
        attachment = attrs.get("attachment", None)
        
        if attachment:
            if attachment.size > 5 * 1024 * 1024:
                raise serializers.ValidationError({"attachment": "File size cannot exceed 5MB."})

        if not content and not attachment:
            raise serializers.ValidationError("Message must include text content or an attachment.")
        return attrs

    def create(self, validated_data):
        attachment = validated_data.get("attachment", None)
        if attachment:
            validated_data["attachment_name"] = validated_data.get("attachment_name") or getattr(attachment, "name", "") or ""
            validated_data["attachment_mime"] = validated_data.get("attachment_mime") or getattr(attachment, "content_type", "") or ""
        return super().create(validated_data)

    def get_read_by_count(self, obj):
        # Exclude sender from "seen by"
        return CompanyChatMessageRead.objects.filter(message=obj).exclude(user_id=obj.sender_id).count()

    def get_reactions(self, obj):
        """Return reactions as {emoji: [user_id, ...]} dict."""
        qs = CompanyChatMessageReaction.objects.filter(message=obj).values_list("emoji", "user_id")
        result = {}
        for emoji, user_id in qs:
            result.setdefault(emoji, []).append(user_id)
        return result

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Sanitize deleted messages — hide content & attachment data
        if instance.is_deleted:
            data["content"] = ""
            data["attachment_url"] = None
            data["attachment_name"] = ""
            data["attachment_mime"] = ""
        return data

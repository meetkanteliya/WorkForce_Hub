import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatMessage, CompanyChatMessage
from employees.models import Department
from accounts.models import User
import urllib.parse
import jwt
from django.conf import settings

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.department_id = self.scope['url_route']['kwargs']['department_id']
        self.room_group_name = f'chat_{self.department_id}'

        # Auth via token in query string since WebSocket headers can't be easily set in browser API sometimes.
        query_string = self.scope['query_string'].decode()
        query_params = urllib.parse.parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        user = await self.get_user_from_token(token)
        
        if not user or not user.is_active:
            await self.close()
            return

        self.user = user

        # Verify access
        if not await self.check_department_access(user, self.department_id):
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json.get('message')

        if message:
            if not await self.is_user_active(self.user.id):
                await self.close()
                return
            # Save to DB
            chat_message = await self.save_message(self.user.id, self.department_id, message)
            
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'id': chat_message.id,
                    'message': chat_message.content,
                    'sender_id': self.user.id,
                    'sender_name': await self.get_full_name(self.user.id),
                    'sender_profile_picture': await self.get_profile_pic(self.user),
                    'timestamp': chat_message.timestamp.isoformat()
                }
            )

    # Receive message from room group
    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def get_user_from_token(self, token):
        if not token: return None
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            return User.objects.get(id=payload['user_id'])
        except Exception:
            return None

    @database_sync_to_async
    def check_department_access(self, user, department_id):
        if user.role in ['admin', 'hr']:
            return True
        if hasattr(user, 'employee'):
            return str(user.employee.department_id) == str(department_id)
        return False

    @database_sync_to_async
    def save_message(self, user_id, department_id, content):
        return ChatMessage.objects.create(
            sender_id=user_id,
            department_id=department_id,
            content=content
        )

    @database_sync_to_async
    def get_profile_pic(self, user):
        try:
            return user.employee.profile_picture.url if user.employee.profile_picture else None
        except Exception:
            return None

    @database_sync_to_async
    def get_full_name(self, user_id):
        try:
            u = User.objects.get(id=user_id)
            name = (u.get_full_name() or "").strip()
            return name or u.username
        except Exception:
            return ""

    @database_sync_to_async
    def is_user_active(self, user_id):
        return User.objects.filter(id=user_id, is_active=True).exists()


class CompanyChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = "company_chat"

        query_string = self.scope['query_string'].decode()
        query_params = urllib.parse.parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        user = await self.get_user_from_token(token)
        if not user or not user.is_active or not await self.has_employee_profile(user.id):
            await self.close()
            return

        self.user = user

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Broadcast join presence (lightweight)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "company_presence",
                "event": "join",
                "user_id": self.user.id,
                "full_name": await self.get_full_name(self.user.id),
            },
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        if getattr(self, "user", None):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "company_presence",
                    "event": "leave",
                    "user_id": self.user.id,
                    "full_name": await self.get_full_name(self.user.id),
                },
            )

    async def receive(self, text_data):
        data = json.loads(text_data or "{}")
        event_type = data.get("type") or "message"

        if not await self.is_user_active(self.user.id) or not await self.has_employee_profile(self.user.id):
            await self.close()
            return

        if event_type == "typing":
            is_typing = bool(data.get("is_typing"))
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "company_typing",
                    "user_id": self.user.id,
                    "full_name": await self.get_full_name(self.user.id),
                    "is_typing": is_typing,
                },
            )
            return

        # default: message
        message = (data.get("message") or "").strip()
        if not message:
            return

        msg = await self.save_company_message(self.user.id, message)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "company_chat_message",
                "payload": await self.serialize_company_message(msg.id),
            },
        )

    async def company_chat_message(self, event):
        await self.send(text_data=json.dumps({"type": "message", **event}))

    async def company_typing(self, event):
        await self.send(text_data=json.dumps({"type": "typing", **event}))

    async def company_presence(self, event):
        await self.send(text_data=json.dumps({"type": "presence", **event}))

    async def employee_event(self, event):
        # Forward employee join/leave/profile updates to clients
        await self.send(text_data=json.dumps({"type": "employee", **event}))

    @database_sync_to_async
    def get_user_from_token(self, token):
        if not token:
            return None
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            return User.objects.get(id=payload['user_id'])
        except Exception:
            return None

    @database_sync_to_async
    def has_employee_profile(self, user_id):
        return User.objects.filter(id=user_id, employee__isnull=False).exists()

    @database_sync_to_async
    def is_user_active(self, user_id):
        return User.objects.filter(id=user_id, is_active=True).exists()

    @database_sync_to_async
    def get_full_name(self, user_id):
        try:
            u = User.objects.get(id=user_id)
            name = (u.get_full_name() or "").strip()
            return name or u.username
        except Exception:
            return ""

    @database_sync_to_async
    def save_company_message(self, user_id, content):
        return CompanyChatMessage.objects.create(sender_id=user_id, content=content)

    @database_sync_to_async
    def serialize_company_message(self, msg_id):
        from .serializers import CompanyChatMessageSerializer
        msg = CompanyChatMessage.objects.select_related("sender").get(id=msg_id)
        return CompanyChatMessageSerializer(msg).data

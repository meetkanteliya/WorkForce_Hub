import json
import logging
import urllib.parse
from django.db import IntegrityError
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatMessage, CompanyChatMessage, CompanyChatMessageReaction
from employees.models import Department
from accounts.models import User
from django.conf import settings
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

logger = logging.getLogger("chat_debug")
logger.setLevel(logging.DEBUG)
if not logger.handlers:
    fh = logging.FileHandler("chat_debug.log")
    fh.setFormatter(logging.Formatter('%(asctime)s - %(message)s'))
    logger.addHandler(fh)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.department_id = self.scope['url_route']['kwargs']['department_id']
        self.room_group_name = f'chat_{self.department_id}'
        
        query_string = self.scope['query_string'].decode()
        query_params = urllib.parse.parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        user = await self.get_user_from_token(token)
        if not user or not user.is_active:
            await self.close()
            return

        if not await self.check_department_access(user, self.department_id):
            await self.close()
            return

        self.user = user
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            logger.error("Invalid JSON received in ChatConsumer")
            return
        
        message = data.get('message')
        temp_id = data.get('temp_id')
        
        if message:
            chat_message = await self.save_message(self.user.id, self.department_id, message)
            payload = {
                'type': 'chat_message',
                'id': chat_message.id,
                'message': chat_message.content,
                'sender_id': self.user.id,
                'sender_name': await self.get_full_name(self.user.id),
                'sender_profile_picture': await self.get_profile_picture(self.user.id),
                'timestamp': chat_message.timestamp.isoformat()
            }
            
            # Echo temp_id back for frontend reconciliation
            if temp_id:
                payload['temp_id'] = temp_id
            
            await self.channel_layer.group_send(self.room_group_name, payload)

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def get_user_from_token(self, token):
        if not token: return None
        try:
            access = AccessToken(token)
            return User.objects.get(id=access["user_id"])
        except Exception:
            return None

    @database_sync_to_async
    def check_department_access(self, user, department_id):
        if user.role in ['admin', 'hr']: return True
        return hasattr(user, 'employee') and str(user.employee.department_id) == str(department_id)

    @database_sync_to_async
    def save_message(self, user_id, department_id, content):
        return ChatMessage.objects.create(sender_id=user_id, department_id=department_id, content=content)

    @database_sync_to_async
    def get_full_name(self, user_id):
        u = User.objects.get(id=user_id)
        return (u.get_full_name() or u.username).strip()
    
    @database_sync_to_async
    def get_profile_picture(self, user_id):
        try:
            u = User.objects.get(id=user_id)
            return u.employee.profile_picture.url if hasattr(u, 'employee') and u.employee.profile_picture else None
        except Exception:
            return None

class CompanyChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = "company_chat"
        query_string = self.scope['query_string'].decode()
        query_params = urllib.parse.parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        user = await self.get_user_from_token(token)
        if not user or not user.is_active:
            await self.close()
            return

        self.user = user
        self.full_name = await self.get_full_name(self.user.id)

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "company_presence",
                "event": "join",
                "user_id": self.user.id,
                "full_name": self.full_name,
            },
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        if hasattr(self, "user"):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "company_presence",
                    "event": "leave",
                    "user_id": self.user.id,
                    "full_name": self.full_name,
                },
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data or "{}")
        except json.JSONDecodeError:
            logger.error("Invalid JSON received in CompanyChatConsumer")
            return
        
        event_type = data.get("type") or "message"

        if event_type == "typing":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "company_typing",
                    "user_id": self.user.id,
                    "full_name": self.full_name,
                    "is_typing": bool(data.get("is_typing")),
                },
            )
            return

        if event_type == "reaction":
            message_id = data.get("message_id")
            emoji = data.get("emoji")
            if message_id and emoji:
                if await self.toggle_reaction(self.user.id, message_id, emoji):
                    reactions = await self.get_message_reactions(message_id)
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "company_reaction_update",
                            "message_id": message_id,
                            "reactions": reactions,
                        },
                    )
            return

        message = (data.get("message") or "").strip()
        temp_id = data.get("temp_id")
        reply_to_id = data.get("reply_to_id")
        
        # Validation
        if not message and not data.get("attachment"):
            return
        
        # Validate message length
        if len(message) > 5000:
            return
        
        # Validate reply_to_id exists if provided
        if reply_to_id:
            if not await self.message_exists(reply_to_id):
                reply_to_id = None

        msg = await self.save_company_message(self.user.id, message, reply_to_id)
        payload = await self.serialize_company_message(msg.id)
        
        # Echo temp_id back for frontend reconciliation
        if temp_id:
            payload["temp_id"] = temp_id

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "company_chat_message",
                "payload": payload,
            },
        )

    async def company_chat_message(self, event):
        await self.send(text_data=json.dumps({"type": "company_chat_message", "payload": event["payload"]}))

    async def company_typing(self, event):
        await self.send(text_data=json.dumps({"type": "company_typing", **event}))

    async def company_presence(self, event):
        await self.send(text_data=json.dumps({"type": "company_presence", **event}))

    async def company_reaction_update(self, event):
        await self.send(text_data=json.dumps({"type": "company_reaction_update", **event}))

    @database_sync_to_async
    def get_user_from_token(self, token):
        if not token: return None
        try:
            access = AccessToken(token)
            return User.objects.get(id=access["user_id"])
        except Exception:
            return None

    @database_sync_to_async
    def get_full_name(self, user_id):
        u = User.objects.get(id=user_id)
        return (u.get_full_name() or u.username).strip()

    @database_sync_to_async
    def save_company_message(self, user_id, content, reply_to_id=None):
        return CompanyChatMessage.objects.create(sender_id=user_id, content=content, reply_to_id=reply_to_id)

    @database_sync_to_async
    def serialize_company_message(self, msg_id):
        from .serializers import CompanyChatMessageSerializer
        msg = CompanyChatMessage.objects.select_related("sender").get(id=msg_id)
        return CompanyChatMessageSerializer(msg).data

    @database_sync_to_async
    def toggle_reaction(self, user_id, message_id, emoji):
        """
        Toggle reaction with one-reaction-per-user constraint.
        If user already has a different reaction, replace it.
        If user clicks same reaction, remove it.
        """
        message = CompanyChatMessage.objects.filter(id=message_id, deleted_at__isnull=True).first()
        if not message: 
            return False
        
        # Get user's existing reaction on this message (if any)
        existing_reaction = CompanyChatMessageReaction.objects.filter(
            message_id=message_id, 
            user_id=user_id
        ).first()
        
        if existing_reaction:
            if existing_reaction.emoji == emoji:
                # Same emoji - remove it (toggle off)
                existing_reaction.delete()
            else:
                # Different emoji - replace it
                existing_reaction.emoji = emoji
                existing_reaction.save(update_fields=['emoji'])
        else:
            # No existing reaction - create new one
            CompanyChatMessageReaction.objects.create(
                message_id=message_id, 
                user_id=user_id, 
                emoji=emoji
            )
        
        return True

    @database_sync_to_async
    def get_message_reactions(self, message_id):
        qs = CompanyChatMessageReaction.objects.filter(message_id=message_id).values_list("emoji", "user_id")
        res = {}
        for emoji, uid in qs:
            res.setdefault(emoji, []).append(uid)
        return res

    @database_sync_to_async
    def message_exists(self, message_id):
        return CompanyChatMessage.objects.filter(id=message_id, deleted_at__isnull=True).exists()

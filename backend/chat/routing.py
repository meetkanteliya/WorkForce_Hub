from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'^ws/chat/(?P<department_id>\w+)/$', consumers.ChatConsumer.as_asgi()),
    re_path(r'^ws/company-chat/$', consumers.CompanyChatConsumer.as_asgi()),
]

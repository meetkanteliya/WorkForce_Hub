from django.urls import path
from .views import ChatMessageListView, CompanyChatMembersView, CompanyChatMessageListCreateView

urlpatterns = [
    path('messages/', ChatMessageListView.as_view(), name='chat-messages'),
    path('company/members/', CompanyChatMembersView.as_view(), name='company-chat-members'),
    path('company/messages/', CompanyChatMessageListCreateView.as_view(), name='company-chat-messages'),
]

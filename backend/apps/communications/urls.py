from django.urls import path
from . import views

urlpatterns = [
    # Public
    path("contact/", views.ContactInquiryView.as_view(), name="contact"),
    path("faqs/", views.FAQListView.as_view(), name="faqs"),
    path("chatbot/", views.ChatbotView.as_view(), name="chatbot"),

    # BRIQ inbound SMS webhook
    path("briq/webhook/", views.BriqWebhookView.as_view(), name="briq-webhook"),

    # Authenticated: notifications
    path("notifications/", views.NotificationListView.as_view(), name="notifications"),
    path("notifications/read/", views.NotificationMarkReadView.as_view(), name="notifications-read-all"),
    path("notifications/<uuid:pk>/read/", views.NotificationMarkReadView.as_view(), name="notification-read"),

    # Authenticated: conversations
    path("conversations/", views.ConversationListCreateView.as_view(), name="conversations"),
    path("conversations/<uuid:pk>/", views.ConversationDetailView.as_view(), name="conversation-detail"),
    path("conversations/<uuid:conv_id>/messages/", views.MessageListCreateView.as_view(), name="messages"),

    # Admin
    path("admin/faqs/", views.AdminFAQView.as_view(), name="admin-faqs"),
    path("admin/faqs/<uuid:pk>/", views.AdminFAQDetailView.as_view(), name="admin-faq-detail"),
    path("admin/conversations/start/", views.AdminStartConversationView.as_view(), name="admin-start-conv"),
    path("admin/broadcast/", views.AdminBroadcastNotificationView.as_view(), name="admin-broadcast"),
]

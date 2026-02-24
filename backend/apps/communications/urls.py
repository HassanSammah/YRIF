from django.urls import path
from . import views

urlpatterns = [
    path("contact/", views.ContactInquiryView.as_view(), name="contact"),
    path("faqs/", views.FAQListView.as_view(), name="faqs"),
    path("notifications/", views.NotificationListView.as_view(), name="notifications"),
    path("chatbot/", views.ChatbotView.as_view(), name="chatbot"),
]

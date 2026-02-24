from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import ContactInquiry, FAQ, Notification
from .serializers import ContactInquirySerializer, FAQSerializer, NotificationSerializer
from .chatbot import send_chatbot_message


class ContactInquiryView(generics.CreateAPIView):
    serializer_class = ContactInquirySerializer
    permission_classes = [AllowAny]


class FAQListView(generics.ListAPIView):
    serializer_class = FAQSerializer
    permission_classes = [AllowAny]
    queryset = FAQ.objects.filter(is_published=True)


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


class ChatbotView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        message = request.data.get("message", "").strip()
        chat_id = request.data.get("chat_id", "anonymous")
        if not message:
            return Response({"error": "message is required"}, status=status.HTTP_400_BAD_REQUEST)
        reply = send_chatbot_message(chat_id=chat_id, message=message)
        return Response(reply)

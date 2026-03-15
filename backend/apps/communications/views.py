import logging
from django.utils import timezone
from django.conf import settings
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from apps.accounts.models import User
from apps.core.permissions import IsAdmin
from .models import FAQ, Notification, Conversation, Message
from .serializers import (
    ContactInquirySerializer, FAQSerializer, NotificationSerializer,
    ConversationSerializer, MessageSerializer,
)
from .chatbot import send_chatbot_message
from .emails import notify_contact_received, notify_contact_auto_reply

logger = logging.getLogger(__name__)


# ── Contact Form ──────────────────────────────────────────────────────────────

class ContactInquiryView(generics.CreateAPIView):
    serializer_class = ContactInquirySerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        inquiry = serializer.save()
        # Forward to info@yriftz.org + send auto-reply
        notify_contact_received(
            name=inquiry.name,
            email=inquiry.email,
            subject=inquiry.subject,
            message=inquiry.message,
        )
        notify_contact_auto_reply(
            name=inquiry.name,
            email=inquiry.email,
            subject=inquiry.subject,
        )


# ── FAQs ──────────────────────────────────────────────────────────────────────

class FAQListView(generics.ListAPIView):
    serializer_class = FAQSerializer
    permission_classes = [AllowAny]
    queryset = FAQ.objects.filter(is_published=True)


class AdminFAQView(generics.ListCreateAPIView):
    serializer_class = FAQSerializer
    permission_classes = [IsAdmin]
    queryset = FAQ.objects.all()


class AdminFAQDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FAQSerializer
    permission_classes = [IsAdmin]
    queryset = FAQ.objects.all()


# ── Notifications ─────────────────────────────────────────────────────────────

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


class NotificationMarkReadView(APIView):
    """Mark one or all notifications as read."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk=None):
        qs = Notification.objects.filter(recipient=request.user)
        if pk:
            qs = qs.filter(pk=pk)
        updated = qs.update(is_read=True)
        return Response({"updated": updated})


# ── Chatbot ───────────────────────────────────────────────────────────────────

class ChatbotView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        message = request.data.get("message", "").strip()
        chat_id = request.data.get("chat_id", "anonymous")
        if not message:
            return Response({"error": "message is required"}, status=status.HTTP_400_BAD_REQUEST)
        reply = send_chatbot_message(chat_id=chat_id, message=message)
        return Response(reply)


# ── Sarufi Webhook (escalation fulfillment) ────────────────────────────────────

class SarufiWebhookView(APIView):
    """
    Fulfillment webhook called by Sarufi when 'escalate' intent is triggered.
    Creates an admin-support notification so staff can follow up with the user.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        intent = request.data.get("intent", "")
        chat_id = request.data.get("chat_id", "")
        message = request.data.get("message", "")

        logger.info("Sarufi webhook — intent=%s chat_id=%s message=%s", intent, chat_id, message)

        if intent == "escalate":
            # Notify all admins about the escalation request
            admin_users = User.objects.filter(role="admin", status="active")
            notifications = [
                Notification(
                    recipient=admin,
                    channel=Notification.Channel.IN_APP,
                    subject="YRIF Chat: Escalation Request",
                    body=(
                        f"A user (chat_id: {chat_id}) requested human support via YRIF Chat.\n"
                        f"Last message: {message[:300]}"
                    ),
                    status=Notification.Status.SENT,
                )
                for admin in admin_users
            ]
            if notifications:
                Notification.objects.bulk_create(notifications, batch_size=100)
                logger.info("Escalation notifications sent to %d admins.", len(notifications))

        # Return Sarufi-compatible fulfillment response
        return Response({
            "message": [
                "Ujumbe wako umetumwa kwa timu yetu. 👨‍💼\n"
                "Tutawasiliana nawe ndani ya masaa 24 kwa barua pepe.\n"
                "📧 Au wasiliana moja kwa moja: info@yriftz.org"
            ]
        })


# ── BRIQ Incoming SMS Webhook ─────────────────────────────────────────────────

class BriqWebhookView(APIView):
    """
    Handle incoming SMS messages from Briq.tz.
    Configure this URL in the BRIQ developer dashboard as the inbound webhook.
    Webhook URL: https://your-domain.com/api/v1/communications/briq/webhook/
    """
    permission_classes = [AllowAny]
    authentication_classes = []  # BRIQ sends unauthenticated POST

    def post(self, request):
        # Validate shared secret if configured
        shared_secret = getattr(settings, "BRIQ_WEBHOOK_SECRET", "")
        if shared_secret:
            incoming_secret = request.headers.get("X-Webhook-Secret", "")
            if incoming_secret != shared_secret:
                return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        from_number = request.data.get("from") or request.data.get("sender", "")
        message_text = request.data.get("message") or request.data.get("text", "")
        to = request.data.get("to", "")

        logger.info("BRIQ inbound SMS — from=%s to=%s message=%s", from_number, to, message_text)

        # Try to match to a user by phone number
        if from_number:
            try:
                # Normalise to +255 format
                phone = from_number.strip()
                if phone.startswith("0"):
                    phone = "+255" + phone[1:]
                elif phone.startswith("255") and not phone.startswith("+"):
                    phone = "+" + phone

                user = User.objects.filter(phone_number=phone).first()
                if user:
                    Notification.objects.create(
                        recipient=user,
                        channel=Notification.Channel.SMS,
                        subject="Incoming SMS",
                        body=message_text,
                        status=Notification.Status.SENT,
                    )
            except Exception as exc:
                logger.error("BRIQ webhook user lookup error: %s", exc)

        return Response({"status": "received"})


# ── Conversations ─────────────────────────────────────────────────────────────

class ConversationListCreateView(generics.ListCreateAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(
            participants=self.request.user
        ).prefetch_related("participants").order_by("-updated_at")

    def perform_create(self, serializer):
        participant_ids = self.request.data.get("participant_ids", [])
        conv = serializer.save()
        # Always add requesting user
        conv.participants.add(self.request.user)
        # Add others — enforce active user check
        for uid in participant_ids:
            try:
                user = User.objects.get(pk=uid, status="active")
                conv.participants.add(user)
            except User.DoesNotExist:
                pass


class ConversationDetailView(generics.RetrieveAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user)


# ── Messages ──────────────────────────────────────────────────────────────────

class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def _get_conversation(self):
        conv_id = self.kwargs["conv_id"]
        return generics.get_object_or_404(
            Conversation, pk=conv_id, participants=self.request.user
        )

    def get_queryset(self):
        conv = self._get_conversation()
        # Mark incoming messages as read
        conv.messages.filter(is_read=False).exclude(sender=self.request.user).update(is_read=True)
        return conv.messages.select_related("sender")

    def perform_create(self, serializer):
        conv = self._get_conversation()
        msg = serializer.save(conversation=conv, sender=self.request.user)
        # Bump conversation updated_at
        conv.save(update_fields=["updated_at"])
        # Create in-app notification for other participants
        for participant in conv.participants.exclude(pk=self.request.user.pk):
            Notification.objects.create(
                recipient=participant,
                channel=Notification.Channel.IN_APP,
                subject=f"New message from {self.request.user.get_full_name() or self.request.user.email}",
                body=msg.text[:200],
                status=Notification.Status.SENT,
            )


# ── Admin: start conversation with user ───────────────────────────────────────

class AdminStartConversationView(APIView):
    """Admin creates a user_admin conversation with a specific user."""
    permission_classes = [IsAdmin]

    def post(self, request):
        user_id = request.data.get("user_id")
        subject = request.data.get("subject", "Support")
        if not user_id:
            return Response({"detail": "user_id required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            target = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # Reuse existing open admin conversation if present
        existing = Conversation.objects.filter(
            conv_type=Conversation.ConvType.USER_ADMIN,
            participants=request.user,
        ).filter(participants=target).first()

        if existing:
            conv = existing
        else:
            conv = Conversation.objects.create(
                conv_type=Conversation.ConvType.USER_ADMIN,
                subject=subject,
            )
            conv.participants.add(request.user, target)

        serializer = ConversationSerializer(conv, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ── Admin: broadcast notification ─────────────────────────────────────────────

class AdminBroadcastNotificationView(APIView):
    """Send an in-app notification to all active users (or filtered by role)."""
    permission_classes = [IsAdmin]

    def post(self, request):
        subject = request.data.get("subject", "")
        body = request.data.get("body", "")
        role = request.data.get("role")  # optional filter

        if not subject or not body:
            return Response({"detail": "subject and body are required"}, status=status.HTTP_400_BAD_REQUEST)

        qs = User.objects.filter(status="active")
        if role:
            qs = qs.filter(role=role)

        notifications = [
            Notification(
                recipient=user,
                channel=Notification.Channel.IN_APP,
                subject=subject,
                body=body,
                status=Notification.Status.SENT,
                sent_at=timezone.now(),
            )
            for user in qs
        ]
        Notification.objects.bulk_create(notifications, batch_size=500)
        return Response({"sent": len(notifications)})

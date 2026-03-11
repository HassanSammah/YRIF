from rest_framework import serializers
from .models import ContactInquiry, FAQ, Notification


class ContactInquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactInquiry
        fields = ["id", "name", "email", "subject", "message", "is_resolved", "created_at"]
        read_only_fields = ["id", "is_resolved", "created_at"]


class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = ["id", "question", "answer", "order"]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "channel", "subject", "body", "status", "sent_at", "created_at"]
        read_only_fields = ["id", "created_at"]

from rest_framework import serializers
from .models import ContactInquiry, FAQ, Notification, Conversation, Message


class ContactInquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactInquiry
        fields = ["id", "name", "email", "subject", "message", "is_resolved", "created_at"]
        read_only_fields = ["id", "is_resolved", "created_at"]


class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = ["id", "question", "answer", "order", "is_published"]
        read_only_fields = ["id"]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "channel", "subject", "body", "status", "is_read", "sent_at", "created_at"]
        read_only_fields = ["id", "created_at"]


class ConversationParticipantSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField()
    role = serializers.CharField(default="")
    avatar = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.email

    def get_avatar(self, obj):
        try:
            profile = getattr(obj, "profile", None)
            if profile and profile.avatar:
                request = self.context.get("request")
                if request:
                    return request.build_absolute_uri(profile.avatar.url)
                return profile.avatar.url
        except Exception:
            pass
        return None


class ConversationSerializer(serializers.ModelSerializer):
    participants = ConversationParticipantSerializer(many=True, read_only=True)
    participant_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False
    )
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    conv_type_display = serializers.CharField(source="get_conv_type_display", read_only=True)

    class Meta:
        model = Conversation
        fields = [
            "id", "conv_type", "conv_type_display", "subject",
            "participants", "participant_ids",
            "last_message", "unread_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_last_message(self, obj):
        last = obj.messages.last()
        if last:
            return {
                "text": last.text,
                "sender_id": str(last.sender_id),
                "created_at": last.created_at.isoformat(),
            }
        return None

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_id = serializers.UUIDField(source="sender.id", read_only=True)

    class Meta:
        model = Message
        fields = ["id", "conversation", "sender_id", "sender_name", "text", "is_read", "created_at"]
        read_only_fields = ["id", "conversation", "sender_id", "sender_name", "is_read", "created_at"]

    def get_sender_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.email

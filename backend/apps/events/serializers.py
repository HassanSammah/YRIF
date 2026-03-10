from rest_framework import serializers
from django.utils import timezone
from .models import Event, EventRegistration, JudgeScore, Winner, Certificate


class EventSerializer(serializers.ModelSerializer):
    registrations_count = serializers.SerializerMethodField()
    is_registration_open = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id", "title", "description", "event_type",
            "start_date", "end_date", "registration_deadline",
            "location", "is_online", "online_link",
            "max_participants", "is_published", "created_by",
            "registrations_count", "is_registration_open",
            "created_at",
        ]
        read_only_fields = ["id", "created_by", "created_at"]

    def get_registrations_count(self, obj):
        return obj.registrations.exclude(status="cancelled").count()

    def get_is_registration_open(self, obj):
        now = timezone.now()
        if obj.registration_deadline and now > obj.registration_deadline:
            return False
        if obj.start_date and now > obj.start_date:
            return False
        count = obj.registrations.exclude(status="cancelled").count()
        if obj.max_participants and count >= obj.max_participants:
            return False
        return True


class JudgeScoreSerializer(serializers.ModelSerializer):
    judge_name = serializers.CharField(source="judge.get_full_name", read_only=True)

    class Meta:
        model = JudgeScore
        fields = ["id", "judge", "judge_name", "score", "comments", "created_at"]
        read_only_fields = ["id", "judge", "judge_name", "created_at"]


class EventRegistrationSerializer(serializers.ModelSerializer):
    participant_name = serializers.CharField(source="participant.get_full_name", read_only=True)
    participant_email = serializers.CharField(source="participant.email", read_only=True)
    event_title = serializers.CharField(source="event.title", read_only=True)
    event_type = serializers.CharField(source="event.event_type", read_only=True)
    event_start_date = serializers.DateTimeField(source="event.start_date", read_only=True)
    scores = JudgeScoreSerializer(many=True, read_only=True)
    has_certificate = serializers.SerializerMethodField()

    class Meta:
        model = EventRegistration
        fields = [
            "id", "event", "event_title", "event_type", "event_start_date",
            "participant", "participant_name", "participant_email",
            "research_submission", "status", "scores", "has_certificate",
            "created_at",
        ]
        read_only_fields = ["id", "event", "participant", "created_at"]

    def get_has_certificate(self, obj):
        return hasattr(obj, "certificate")


class WinnerSerializer(serializers.ModelSerializer):
    participant_name = serializers.CharField(
        source="registration.participant.get_full_name", read_only=True
    )
    research_title = serializers.SerializerMethodField()

    class Meta:
        model = Winner
        fields = [
            "id", "event", "registration", "rank",
            "participant_name", "research_title", "published_at",
        ]
        read_only_fields = ["id", "event", "published_at"]

    def get_research_title(self, obj):
        if obj.registration.research_submission:
            return obj.registration.research_submission.title
        return None


class CertificateSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source="registration.event.title", read_only=True)
    event_id = serializers.CharField(source="registration.event.id", read_only=True)
    registration_id = serializers.CharField(source="registration.id", read_only=True)

    class Meta:
        model = Certificate
        fields = [
            "id", "registration_id", "event_id", "event_title",
            "certificate_type", "position", "issued_at",
        ]
        read_only_fields = ["id", "issued_at"]

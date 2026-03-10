from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import MentorProfile, MentorshipRequest, MentorshipMatch, MentorFeedback

User = get_user_model()


class MentorDirectorySerializer(serializers.ModelSerializer):
    """Mentor user + accounts.MentorProfile data for the public directory."""
    full_name = serializers.SerializerMethodField()
    expertise_areas = serializers.CharField(source="mentor_profile.expertise_areas", default="")
    availability = serializers.CharField(source="mentor_profile.availability", default="")
    is_verified = serializers.BooleanField(source="mentor_profile.is_verified", default=False)
    bio = serializers.CharField(source="profile.bio", default="")

    class Meta:
        model = User
        fields = ["id", "full_name", "email", "expertise_areas", "availability", "is_verified", "bio"]

    def get_full_name(self, obj):
        return obj.get_full_name()


class PartnerDirectorySerializer(serializers.ModelSerializer):
    """Partner user + accounts.PartnerProfile for the partner network directory."""
    full_name = serializers.SerializerMethodField()
    org_name = serializers.CharField(source="partner_profile.org_name", default="")
    partner_type = serializers.CharField(source="partner_profile.partner_type", default="")
    sector = serializers.CharField(source="partner_profile.sector", default="")
    contact_person = serializers.CharField(source="partner_profile.contact_person", default="")
    is_verified = serializers.BooleanField(source="partner_profile.is_verified", default=False)
    bio = serializers.CharField(source="profile.bio", default="")

    class Meta:
        model = User
        fields = ["id", "full_name", "email", "org_name", "partner_type", "sector", "contact_person", "is_verified", "bio"]

    def get_full_name(self, obj):
        return obj.get_full_name()


class MentorshipRequestSerializer(serializers.ModelSerializer):
    mentee_name = serializers.CharField(source="mentee.get_full_name", read_only=True)
    mentee_email = serializers.EmailField(source="mentee.email", read_only=True)
    preferred_mentor_name = serializers.SerializerMethodField()

    class Meta:
        model = MentorshipRequest
        fields = [
            "id", "mentee", "mentee_name", "mentee_email",
            "preferred_mentor", "preferred_mentor_name",
            "topic", "message", "status", "created_at",
        ]
        read_only_fields = ["id", "mentee", "mentee_name", "mentee_email", "status", "created_at"]

    def get_preferred_mentor_name(self, obj):
        return obj.preferred_mentor.get_full_name() if obj.preferred_mentor else None


class MentorshipMatchSerializer(serializers.ModelSerializer):
    mentor_name = serializers.CharField(source="mentor.get_full_name", read_only=True)
    mentor_email = serializers.EmailField(source="mentor.email", read_only=True)
    mentee_name = serializers.CharField(source="mentee.get_full_name", read_only=True)
    mentee_email = serializers.EmailField(source="mentee.email", read_only=True)
    matched_by_name = serializers.SerializerMethodField()
    topic = serializers.SerializerMethodField()

    class Meta:
        model = MentorshipMatch
        fields = [
            "id", "request", "topic",
            "mentor", "mentor_name", "mentor_email",
            "mentee", "mentee_name", "mentee_email",
            "matched_by", "matched_by_name",
            "start_date", "end_date", "status", "notes",
            "created_at",
        ]
        read_only_fields = [
            "id", "mentor_name", "mentor_email", "mentee_name", "mentee_email",
            "matched_by_name", "topic", "created_at",
        ]

    def get_matched_by_name(self, obj):
        return obj.matched_by.get_full_name() if obj.matched_by else None

    def get_topic(self, obj):
        return obj.request.topic if obj.request else None


class MentorFeedbackSerializer(serializers.ModelSerializer):
    given_by_name = serializers.CharField(source="given_by.get_full_name", read_only=True)

    class Meta:
        model = MentorFeedback
        fields = ["id", "match", "given_by", "given_by_name", "rating", "feedback_text", "created_at"]
        read_only_fields = ["id", "given_by", "given_by_name", "created_at"]

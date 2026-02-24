from rest_framework import serializers
from .models import MentorProfile, MentorshipRequest, MentorFeedback


class MentorProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="user.get_full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = MentorProfile
        fields = ["id", "full_name", "email", "expertise_areas", "max_mentees", "is_available", "bio"]


class MentorshipRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = MentorshipRequest
        fields = ["id", "mentee", "mentor", "research_area", "message", "status", "created_at"]
        read_only_fields = ["id", "mentee", "status", "created_at"]


class MentorFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = MentorFeedback
        fields = ["id", "rating", "comments", "created_at"]
        read_only_fields = ["id", "created_at"]

from rest_framework import serializers
from .models import Event, EventRegistration, JudgeScore


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = "__all__"
        read_only_fields = ["id", "created_by", "created_at"]


class EventRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventRegistration
        fields = ["id", "event", "participant", "research_submission", "created_at"]
        read_only_fields = ["id", "event", "participant", "created_at"]


class JudgeScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = JudgeScore
        fields = ["id", "score", "comments", "created_at"]
        read_only_fields = ["id", "created_at"]

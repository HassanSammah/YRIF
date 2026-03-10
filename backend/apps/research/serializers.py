from rest_framework import serializers
from .models import Research, ResearchReview, ReviewAssignment


class ResearchReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source="reviewer.get_full_name", read_only=True)

    class Meta:
        model = ResearchReview
        fields = ["id", "reviewer", "reviewer_name", "comments", "decision", "created_at"]
        read_only_fields = ["id", "reviewer", "reviewer_name", "created_at"]


class ReviewAssignmentSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source="reviewer.get_full_name", read_only=True)
    assigned_by_name = serializers.CharField(source="assigned_by.get_full_name", read_only=True)

    class Meta:
        model = ReviewAssignment
        fields = [
            "id", "reviewer", "reviewer_name",
            "assigned_by", "assigned_by_name",
            "state", "created_at",
        ]
        read_only_fields = ["id", "assigned_by", "assigned_by_name", "state", "created_at"]


class ResearchSerializer(serializers.ModelSerializer):
    """Public / author-facing serializer."""
    author_name = serializers.CharField(source="author.get_full_name", read_only=True)

    class Meta:
        model = Research
        fields = [
            "id", "title", "abstract", "category", "status",
            "author", "author_name", "document", "dataset",
            "keywords", "views_count", "downloads_count",
            "rejection_reason", "published_at", "created_at",
        ]
        read_only_fields = [
            "id", "author", "status", "rejection_reason",
            "views_count", "downloads_count", "published_at", "created_at",
        ]


class ResearchAdminSerializer(serializers.ModelSerializer):
    """Full admin serializer — includes nested reviews and assignments."""
    author_name = serializers.CharField(source="author.get_full_name", read_only=True)
    author_email = serializers.CharField(source="author.email", read_only=True)
    reviews = ResearchReviewSerializer(many=True, read_only=True)
    assignments = ReviewAssignmentSerializer(many=True, read_only=True)

    class Meta:
        model = Research
        fields = [
            "id", "title", "abstract", "category", "status",
            "author", "author_name", "author_email",
            "document", "dataset", "keywords",
            "views_count", "downloads_count",
            "rejection_reason", "published_at", "created_at",
            "reviews", "assignments",
        ]
        read_only_fields = ["id", "author", "views_count", "downloads_count", "created_at"]

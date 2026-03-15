from rest_framework import serializers
from .models import Research, ResearchReview, ReviewAssignment, RAJoinRequest


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


class RAJoinRequestSerializer(serializers.ModelSerializer):
    ra_name = serializers.CharField(source="ra.get_full_name", read_only=True)
    ra_email = serializers.CharField(source="ra.email", read_only=True)
    research_title = serializers.CharField(source="research.title", read_only=True)

    class Meta:
        model = RAJoinRequest
        fields = [
            "id", "research", "research_title",
            "ra", "ra_name", "ra_email",
            "message", "status", "created_at",
        ]
        read_only_fields = ["id", "ra", "research", "research_title", "ra_name", "ra_email", "status", "created_at"]


class ResearchSerializer(serializers.ModelSerializer):
    """Public / author-facing serializer."""
    author_name = serializers.CharField(source="author.get_full_name", read_only=True)
    ra_join_requests = RAJoinRequestSerializer(many=True, read_only=True)

    class Meta:
        model = Research
        fields = [
            "id", "title", "abstract", "category", "status",
            "author", "author_name", "document", "dataset",
            "keywords", "views_count", "downloads_count",
            "rejection_reason", "published_at", "created_at",
            "open_for_collaboration", "collaboration_description",
            "ra_join_requests",
        ]
        read_only_fields = [
            "id", "author", "status", "rejection_reason",
            "views_count", "downloads_count", "published_at", "created_at",
        ]


class OpenResearchSerializer(serializers.ModelSerializer):
    """Serializer for the open-for-collaboration research list (RA-facing)."""
    author_name = serializers.CharField(source="author.get_full_name", read_only=True)
    author_institution = serializers.SerializerMethodField()
    pending_ra_join_count = serializers.SerializerMethodField()

    class Meta:
        model = Research
        fields = [
            "id", "title", "abstract", "category", "status",
            "author", "author_name", "author_institution",
            "keywords", "collaboration_description",
            "views_count", "published_at", "created_at",
            "pending_ra_join_count",
        ]

    def get_author_institution(self, obj):
        try:
            return obj.author.profile.institution or ""
        except Exception:
            return ""

    def get_pending_ra_join_count(self, obj):
        return obj.ra_join_requests.filter(status="pending").count()


class ResearchAdminSerializer(serializers.ModelSerializer):
    """Full admin serializer — includes nested reviews and assignments."""
    author_name = serializers.CharField(source="author.get_full_name", read_only=True)
    author_email = serializers.CharField(source="author.email", read_only=True)
    reviews = ResearchReviewSerializer(many=True, read_only=True)
    assignments = ReviewAssignmentSerializer(many=True, read_only=True)
    ra_join_requests = RAJoinRequestSerializer(many=True, read_only=True)

    class Meta:
        model = Research
        fields = [
            "id", "title", "abstract", "category", "status",
            "author", "author_name", "author_email",
            "document", "dataset", "keywords",
            "views_count", "downloads_count",
            "rejection_reason", "published_at", "created_at",
            "open_for_collaboration", "collaboration_description",
            "reviews", "assignments", "ra_join_requests",
        ]
        read_only_fields = ["id", "author", "views_count", "downloads_count", "created_at"]

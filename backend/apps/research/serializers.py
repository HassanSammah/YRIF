from rest_framework import serializers
from .models import Research, ResearchReview


class ResearchSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.get_full_name", read_only=True)

    class Meta:
        model = Research
        fields = [
            "id", "title", "abstract", "category", "status",
            "author", "author_name", "document", "dataset",
            "keywords", "views_count", "downloads_count",
            "published_at", "created_at",
        ]
        read_only_fields = ["id", "author", "status", "views_count", "downloads_count", "created_at"]


class ResearchReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResearchReview
        fields = ["id", "comments", "decision", "created_at"]
        read_only_fields = ["id", "created_at"]

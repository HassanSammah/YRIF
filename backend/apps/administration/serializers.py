from rest_framework import serializers
from .models import Announcement, NewsPost, AuditLog, ReportExport


class AnnouncementSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.get_full_name", read_only=True, default=None)

    class Meta:
        model = Announcement
        fields = [
            "id", "title", "content", "is_published",
            "author", "author_name", "published_at",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "author", "author_name", "created_at", "updated_at"]


class NewsPostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.get_full_name", read_only=True, default=None)

    class Meta:
        model = NewsPost
        fields = [
            "id", "title", "slug", "body", "cover_image",
            "is_published", "author", "author_name", "published_at",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "author", "author_name", "created_at", "updated_at"]


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.get_full_name", read_only=True, default=None)
    actor_email = serializers.EmailField(source="actor.email", read_only=True, default=None)

    class Meta:
        model = AuditLog
        fields = [
            "id", "actor", "actor_name", "actor_email",
            "action", "target_type", "target_id", "target_repr",
            "details", "created_at",
        ]
        read_only_fields = fields


class ReportExportSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.CharField(
        source="generated_by.get_full_name", read_only=True, default=None
    )

    class Meta:
        model = ReportExport
        fields = [
            "id", "report_type", "filters", "row_count",
            "generated_by", "generated_by_name", "created_at",
        ]
        read_only_fields = fields

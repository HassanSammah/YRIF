from rest_framework import serializers
from .models import Resource, Webinar


class ResourceSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(
        source="created_by.get_full_name", read_only=True, default=None
    )
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Resource
        fields = [
            "id", "title", "description", "resource_type",
            "file", "file_url", "external_url",
            "tags", "is_published",
            "views_count", "downloads_count",
            "created_by", "created_by_name",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "views_count", "downloads_count", "created_by", "created_by_name", "created_at", "updated_at"]

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class ResourceWriteSerializer(serializers.ModelSerializer):
    """Used by content managers for create/update."""
    class Meta:
        model = Resource
        fields = [
            "title", "description", "resource_type",
            "file", "external_url", "tags", "is_published",
        ]


class WebinarSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(
        source="created_by.get_full_name", read_only=True, default=None
    )
    is_past = serializers.SerializerMethodField()

    class Meta:
        model = Webinar
        fields = [
            "id", "title", "description", "scheduled_at",
            "registration_link", "recording_url",
            "tags", "is_published",
            "views_count", "is_past",
            "created_by", "created_by_name",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "views_count", "is_past", "created_by", "created_by_name", "created_at", "updated_at"]

    def get_is_past(self, obj):
        from django.utils import timezone
        return obj.scheduled_at < timezone.now()


class WebinarWriteSerializer(serializers.ModelSerializer):
    """Used by content managers for create/update."""
    class Meta:
        model = Webinar
        fields = [
            "title", "description", "scheduled_at",
            "registration_link", "recording_url",
            "tags", "is_published",
        ]

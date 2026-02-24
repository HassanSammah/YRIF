from rest_framework import serializers
from .models import Resource, Webinar


class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = "__all__"
        read_only_fields = ["id", "downloads_count", "created_at"]


class WebinarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Webinar
        fields = "__all__"
        read_only_fields = ["id", "created_at"]

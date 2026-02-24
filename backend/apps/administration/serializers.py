from rest_framework import serializers
from .models import Announcement, NewsPost


class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = "__all__"
        read_only_fields = ["id", "author", "created_at"]


class NewsPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsPost
        fields = "__all__"
        read_only_fields = ["id", "author", "created_at"]

from django.contrib import admin
from .models import Resource, Webinar


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ["title", "resource_type", "is_published", "views_count", "downloads_count", "created_by", "created_at"]
    list_filter = ["resource_type", "is_published"]
    search_fields = ["title", "description"]
    raw_id_fields = ["created_by"]
    readonly_fields = ["views_count", "downloads_count", "created_at", "updated_at"]


@admin.register(Webinar)
class WebinarAdmin(admin.ModelAdmin):
    list_display = ["title", "scheduled_at", "is_published", "views_count", "created_by", "created_at"]
    list_filter = ["is_published"]
    search_fields = ["title", "description"]
    raw_id_fields = ["created_by"]
    readonly_fields = ["views_count", "created_at", "updated_at"]

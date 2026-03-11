from django.contrib import admin
from .models import Announcement, NewsPost, AuditLog, ReportExport


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ["title", "is_published", "author", "published_at", "created_at"]
    list_filter = ["is_published"]
    search_fields = ["title", "content"]
    raw_id_fields = ["author"]


@admin.register(NewsPost)
class NewsPostAdmin(admin.ModelAdmin):
    list_display = ["title", "slug", "is_published", "author", "published_at"]
    list_filter = ["is_published"]
    search_fields = ["title", "body"]
    prepopulated_fields = {"slug": ("title",)}
    raw_id_fields = ["author"]


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ["action", "actor", "target_type", "target_repr", "created_at"]
    list_filter = ["action", "target_type"]
    search_fields = ["actor__email", "target_repr", "action"]
    raw_id_fields = ["actor"]
    readonly_fields = ["id", "actor", "action", "target_type", "target_id", "target_repr", "details", "created_at"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(ReportExport)
class ReportExportAdmin(admin.ModelAdmin):
    list_display = ["report_type", "generated_by", "row_count", "created_at"]
    list_filter = ["report_type"]
    raw_id_fields = ["generated_by"]
    readonly_fields = ["id", "report_type", "filters", "row_count", "generated_by", "created_at"]

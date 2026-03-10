from django.contrib import admin
from .models import MentorProfile, MentorshipRequest, MentorshipMatch, MentorFeedback


@admin.register(MentorshipRequest)
class MentorshipRequestAdmin(admin.ModelAdmin):
    list_display = ["topic", "mentee", "preferred_mentor", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["topic", "mentee__email", "mentee__first_name", "mentee__last_name"]
    raw_id_fields = ["mentee", "preferred_mentor"]


@admin.register(MentorshipMatch)
class MentorshipMatchAdmin(admin.ModelAdmin):
    list_display = ["mentor", "mentee", "status", "start_date", "matched_by", "created_at"]
    list_filter = ["status"]
    search_fields = ["mentor__email", "mentee__email"]
    raw_id_fields = ["mentor", "mentee", "matched_by", "request"]


@admin.register(MentorFeedback)
class MentorFeedbackAdmin(admin.ModelAdmin):
    list_display = ["given_by", "match", "rating", "created_at"]
    raw_id_fields = ["given_by", "match"]


@admin.register(MentorProfile)
class MentorProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "max_mentees", "is_available"]
    raw_id_fields = ["user"]

from django.contrib import admin

from .models import DonationRecord, Vacancy


@admin.register(Vacancy)
class VacancyAdmin(admin.ModelAdmin):
    list_display = ["title", "type", "location", "deadline", "is_active"]
    list_filter = ["type", "is_active"]
    search_fields = ["title", "location"]
    ordering = ["-created_at"]


@admin.register(DonationRecord)
class DonationRecordAdmin(admin.ModelAdmin):
    list_display = ["name", "email", "amount", "recurring", "created_at"]
    list_filter = ["recurring"]
    readonly_fields = ["created_at", "updated_at"]
    ordering = ["-created_at"]

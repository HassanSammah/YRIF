from django.contrib import admin
from .models import ContactInquiry, FAQ, Notification, Conversation, Message


@admin.register(ContactInquiry)
class ContactInquiryAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "subject", "is_resolved", "created_at")
    list_filter = ("is_resolved",)
    search_fields = ("name", "email", "subject")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ("question", "order", "is_published")
    list_filter = ("is_published",)
    ordering = ("order",)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("recipient", "channel", "subject", "status", "is_read", "sent_at", "created_at")
    list_filter = ("channel", "status", "is_read")
    search_fields = ("recipient__email", "subject")
    readonly_fields = ("created_at", "updated_at")


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "conv_type", "subject", "created_at")
    list_filter = ("conv_type",)
    filter_horizontal = ("participants",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("sender", "conversation", "is_read", "created_at")
    list_filter = ("is_read",)
    readonly_fields = ("created_at", "updated_at")

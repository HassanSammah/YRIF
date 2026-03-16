import csv
from datetime import datetime, date

from django.db.models import Count, Sum, Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import generics, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend

from apps.core.permissions import IsAdmin, IsContentManager
from apps.accounts.models import User, UserStatus, UserRole
from apps.research.models import Research, ResearchStatus
from apps.events.models import Event, EventRegistration
from apps.mentorship.models import MentorshipRequest, MentorshipMatch
from apps.resources.models import Resource, Webinar
from apps.communications.models import ContactInquiry

from .models import Announcement, NewsPost, AuditLog, ReportExport
from .serializers import (
    AnnouncementSerializer,
    NewsPostSerializer,
    AuditLogSerializer,
    ReportExportSerializer,
)
from .utils import log_action
from . import emails as administration_emails


# ── Dashboard Stats ───────────────────────────────────────────────────────────

class DashboardStatsView(APIView):
    """Rich admin dashboard statistics."""
    permission_classes = [IsAdmin]

    def get(self, request):
        now = timezone.now()
        thirty_days_ago = now - timezone.timedelta(days=30)
        seven_days_ago = now - timezone.timedelta(days=7)

        # ── Users ─────────────────────────────────────────────────────────────
        users_qs = User.objects.all()
        user_by_status = {
            s: users_qs.filter(status=s).count()
            for s in [UserStatus.ACTIVE, UserStatus.PENDING_APPROVAL, UserStatus.SUSPENDED, UserStatus.REJECTED]
        }
        user_by_role = {
            r: users_qs.filter(role=r).count()
            for r in UserRole.values
        }

        # ── Research ──────────────────────────────────────────────────────────
        research_qs = Research.objects.all()
        research_by_status = {
            s: research_qs.filter(status=s).count()
            for s in ResearchStatus.values
        }
        research_totals = research_qs.aggregate(
            total_views=Sum("views_count"),
            total_downloads=Sum("downloads_count"),
        )

        # ── Events ────────────────────────────────────────────────────────────
        events_qs = Event.objects.all()
        registrations_qs = EventRegistration.objects.all()

        # ── Mentorship ────────────────────────────────────────────────────────
        mentorship_qs = MentorshipRequest.objects.all()
        matches_qs = MentorshipMatch.objects.all()

        # ── Resources ─────────────────────────────────────────────────────────
        resources_qs = Resource.objects.filter(is_published=True)
        resource_totals = resources_qs.aggregate(
            total_views=Sum("views_count"),
            total_downloads=Sum("downloads_count"),
        )

        # ── Content ───────────────────────────────────────────────────────────
        # ── Recent activity ───────────────────────────────────────────────────
        recent_actions = AuditLog.objects.select_related("actor").order_by("-created_at")[:10]

        # ── New members trend (last 30 days) ──────────────────────────────────
        new_members_30d = users_qs.filter(created_at__gte=thirty_days_ago).count()
        new_members_7d = users_qs.filter(created_at__gte=seven_days_ago).count()
        new_research_30d = research_qs.filter(created_at__gte=thirty_days_ago).count()

        return Response({
            "users": {
                "total": users_qs.count(),
                "by_status": user_by_status,
                "by_role": user_by_role,
                "new_last_30d": new_members_30d,
                "new_last_7d": new_members_7d,
            },
            "research": {
                "total": research_qs.count(),
                "by_status": research_by_status,
                "total_views": research_totals["total_views"] or 0,
                "total_downloads": research_totals["total_downloads"] or 0,
                "new_last_30d": new_research_30d,
            },
            "events": {
                "total": events_qs.count(),
                "published": events_qs.filter(is_published=True).count(),
                "upcoming": events_qs.filter(start_date__gte=now, is_published=True).count(),
                "total_registrations": registrations_qs.count(),
            },
            "mentorship": {
                "total_requests": mentorship_qs.count(),
                "pending_requests": mentorship_qs.filter(status="pending").count(),
                "active_matches": matches_qs.filter(status="active").count(),
                "completed_matches": matches_qs.filter(status="completed").count(),
            },
            "resources": {
                "total": resources_qs.count(),
                "webinars": Webinar.objects.filter(is_published=True).count(),
                "total_views": resource_totals["total_views"] or 0,
                "total_downloads": resource_totals["total_downloads"] or 0,
            },
            "content": {
                "announcements": Announcement.objects.filter(is_published=True).count(),
                "news_posts": NewsPost.objects.filter(is_published=True).count(),
                "open_contacts": ContactInquiry.objects.filter(is_resolved=False).count(),
            },
            "recent_activity": AuditLogSerializer(recent_actions, many=True).data,
        })


# ── CSV Export ────────────────────────────────────────────────────────────────

class ExportReportView(APIView):
    """Generate and stream a CSV report; record to ReportExport + AuditLog."""
    permission_classes = [IsAdmin]

    def get(self, request):
        report_type = request.query_params.get("type", "members")
        date_from_str = request.query_params.get("date_from")
        date_to_str = request.query_params.get("date_to")
        role_filter = request.query_params.get("role", "")
        status_filter = request.query_params.get("status", "")

        # Parse date filters
        date_from = self._parse_date(date_from_str)
        date_to = self._parse_date(date_to_str)

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{report_type}_report_{date.today()}.csv"'
        writer = csv.writer(response)

        row_count = 0
        filters_used = {
            "date_from": date_from_str or "",
            "date_to": date_to_str or "",
            "role": role_filter,
            "status": status_filter,
        }

        if report_type == "members":
            row_count = self._export_members(writer, date_from, date_to, role_filter, status_filter)
        elif report_type == "research":
            row_count = self._export_research(writer, date_from, date_to, status_filter)
        elif report_type == "events":
            row_count = self._export_events(writer, date_from, date_to)
        elif report_type == "mentorship":
            row_count = self._export_mentorship(writer, date_from, date_to)
        else:
            writer.writerow(["Error", f"Unknown report type: {report_type}"])

        # Record export
        export = ReportExport.objects.create(
            report_type=report_type,
            filters=filters_used,
            generated_by=request.user,
            row_count=row_count,
        )
        log_action(
            request.user,
            "report.exported",
            "report",
            export.id,
            f"{report_type} report ({row_count} rows)",
            filters_used,
        )

        return response

    def _parse_date(self, s):
        if not s:
            return None
        try:
            return datetime.strptime(s, "%Y-%m-%d").date()
        except ValueError:
            return None

    def _date_filter(self, qs, field, date_from, date_to):
        if date_from:
            qs = qs.filter(**{f"{field}__date__gte": date_from})
        if date_to:
            qs = qs.filter(**{f"{field}__date__lte": date_to})
        return qs

    def _export_members(self, writer, date_from, date_to, role_filter, status_filter):
        writer.writerow(["ID", "First Name", "Last Name", "Email", "Role", "Status", "Joined"])
        qs = User.objects.all()
        qs = self._date_filter(qs, "created_at", date_from, date_to)
        if role_filter:
            qs = qs.filter(role=role_filter)
        if status_filter:
            qs = qs.filter(status=status_filter)
        qs = qs.order_by("created_at")
        count = 0
        for u in qs.iterator():
            writer.writerow([u.id, u.first_name, u.last_name, u.email, u.role, u.status, u.created_at.date()])
            count += 1
        return count

    def _export_research(self, writer, date_from, date_to, status_filter):
        writer.writerow(["ID", "Title", "Category", "Status", "Author", "Views", "Downloads", "Submitted"])
        qs = Research.objects.select_related("author")
        qs = self._date_filter(qs, "created_at", date_from, date_to)
        if status_filter:
            qs = qs.filter(status=status_filter)
        qs = qs.order_by("created_at")
        count = 0
        for r in qs.iterator():
            writer.writerow([
                r.id, r.title, r.category, r.status,
                r.author.get_full_name(), r.views_count, r.downloads_count,
                r.created_at.date(),
            ])
            count += 1
        return count

    def _export_events(self, writer, date_from, date_to):
        writer.writerow(["Event ID", "Title", "Type", "Start Date", "Location", "Registrations", "Published"])
        qs = Event.objects.annotate(reg_count=Count("registrations"))
        qs = self._date_filter(qs, "start_date", date_from, date_to)
        qs = qs.order_by("start_date")
        count = 0
        for e in qs.iterator():
            writer.writerow([
                e.id, e.title, e.event_type,
                e.start_date.date(), e.location or "Online",
                e.reg_count, e.is_published,
            ])
            count += 1
        return count

    def _export_mentorship(self, writer, date_from, date_to):
        writer.writerow(["Request ID", "Mentee", "Mentor", "Topic", "Status", "Created"])
        qs = MentorshipRequest.objects.select_related("mentee", "preferred_mentor")
        qs = self._date_filter(qs, "created_at", date_from, date_to)
        qs = qs.order_by("created_at")
        count = 0
        for r in qs.iterator():
            writer.writerow([
                r.id, r.mentee.get_full_name(),
                r.preferred_mentor.get_full_name() if r.preferred_mentor else "",
                r.topic, r.status, r.created_at.date(),
            ])
            count += 1
        return count


# ── Audit Log ─────────────────────────────────────────────────────────────────

class AuditLogListView(generics.ListAPIView):
    """Admin: browse the audit trail."""
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["action", "target_type"]
    search_fields = ["target_repr", "actor__email", "actor__first_name"]

    def get_queryset(self):
        return AuditLog.objects.select_related("actor").order_by("-created_at")


class ReportExportListView(generics.ListAPIView):
    """Admin: browse export history."""
    serializer_class = ReportExportSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return ReportExport.objects.select_related("generated_by").order_by("-created_at")[:50]


# ── Public content ────────────────────────────────────────────────────────────

class PublicAnnouncementListView(generics.ListAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [AllowAny]
    queryset = Announcement.objects.filter(is_published=True)


class PublicNewsListView(generics.ListAPIView):
    serializer_class = NewsPostSerializer
    permission_classes = [AllowAny]
    queryset = NewsPost.objects.filter(is_published=True)
    filter_backends = [filters.SearchFilter]
    search_fields = ["title"]


class PublicNewsDetailView(generics.RetrieveAPIView):
    serializer_class = NewsPostSerializer
    permission_classes = [AllowAny]
    queryset = NewsPost.objects.filter(is_published=True)
    lookup_field = "slug"


# ── Admin: Announcements CRUD ─────────────────────────────────────────────────

class AnnouncementListView(generics.ListCreateAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsContentManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["is_published"]
    search_fields = ["title"]

    def get_queryset(self):
        return Announcement.objects.all().select_related("author").order_by("-created_at")

    def perform_create(self, serializer):
        instance = serializer.save(author=self.request.user)
        log_action(self.request.user, "announcement.created", "announcement", instance.id, instance.title)


class AnnouncementDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsContentManager]
    queryset = Announcement.objects.all()

    def perform_update(self, serializer):
        instance = serializer.save()
        # Auto-set published_at when first published
        if instance.is_published and not instance.published_at:
            instance.published_at = timezone.now()
            instance.save(update_fields=["published_at"])
        log_action(self.request.user, "announcement.updated", "announcement", instance.id, instance.title)

    def perform_destroy(self, instance):
        log_action(self.request.user, "announcement.deleted", "announcement", instance.id, instance.title)
        instance.delete()


# ── Admin: News/Blog CRUD ─────────────────────────────────────────────────────

class NewsListView(generics.ListCreateAPIView):
    serializer_class = NewsPostSerializer
    permission_classes = [IsContentManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["is_published"]
    search_fields = ["title"]

    def get_queryset(self):
        return NewsPost.objects.all().select_related("author").order_by("-created_at")

    def perform_create(self, serializer):
        instance = serializer.save(author=self.request.user)
        log_action(self.request.user, "news.created", "news", instance.id, instance.title)


class NewsDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NewsPostSerializer
    permission_classes = [IsContentManager]
    queryset = NewsPost.objects.all()
    lookup_field = "slug"

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.is_published and not instance.published_at:
            instance.published_at = timezone.now()
            instance.save(update_fields=["published_at"])
        log_action(self.request.user, "news.updated", "news", instance.id, instance.title)

    def perform_destroy(self, instance):
        log_action(self.request.user, "news.deleted", "news", instance.id, instance.title)
        instance.delete()


# ── Admin: Email Blasts ───────────────────────────────────────────────────────

class NewsBlastView(APIView):
    """Send a published NewsPost as an email blast to all active users."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        from django.shortcuts import get_object_or_404
        news_post = get_object_or_404(NewsPost, pk=pk)
        sent = administration_emails.send_news_blast(news_post)
        log_action(request.user, "news.blasted", "news_post", news_post.id, news_post.title)
        return Response({"sent": sent, "detail": f"News blast sent to {sent} users."})


class AnnouncementBlastView(APIView):
    """Send a published Announcement as an email blast to all active users."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        from django.shortcuts import get_object_or_404
        announcement = get_object_or_404(Announcement, pk=pk)
        sent = administration_emails.send_announcement_blast(announcement)
        log_action(request.user, "announcement.blasted", "announcement",
                   announcement.id, announcement.title)
        return Response({"sent": sent, "detail": f"Announcement blast sent to {sent} users."})


# ── Admin: Contact Inquiries ──────────────────────────────────────────────────

class AdminContactListView(generics.ListAPIView):
    """Admin: list all contact inquiries."""
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["is_resolved"]
    search_fields = ["name", "email", "subject"]

    def get_queryset(self):
        from apps.communications.models import ContactInquiry
        from apps.communications.serializers import ContactInquirySerializer
        return ContactInquiry.objects.all().order_by("-created_at")

    def get_serializer_class(self):
        from apps.communications.serializers import ContactInquirySerializer
        return ContactInquirySerializer


class AdminContactResolveView(APIView):
    """Admin: mark a contact inquiry as resolved."""
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        from apps.communications.models import ContactInquiry
        from apps.communications.serializers import ContactInquirySerializer
        inquiry = generics.get_object_or_404(ContactInquiry, pk=pk)
        inquiry.is_resolved = True
        inquiry.save(update_fields=["is_resolved", "updated_at"])
        log_action(request.user, "contact.resolved", "contact", inquiry.id, inquiry.subject)
        return Response(ContactInquirySerializer(inquiry).data)

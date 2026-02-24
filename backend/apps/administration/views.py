import csv
import io
from django.http import HttpResponse
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.core.permissions import IsAdmin, IsContentManager
from apps.accounts.models import User
from apps.research.models import Research, ResearchStatus
from apps.events.models import EventRegistration
from .models import Announcement, NewsPost
from .serializers import AnnouncementSerializer, NewsPostSerializer


class DashboardStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        stats = {
            "total_members": User.objects.count(),
            "approved_members": User.objects.filter(is_approved=True).count(),
            "pending_approvals": User.objects.filter(is_approved=False, is_active=True).count(),
            "total_research": Research.objects.count(),
            "approved_publications": Research.objects.filter(status=ResearchStatus.APPROVED).count(),
            "total_event_registrations": EventRegistration.objects.count(),
        }
        return Response(stats)


class ExportReportView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        report_type = request.query_params.get("type", "members")
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{report_type}_report.csv"'

        writer = csv.writer(response)
        if report_type == "members":
            writer.writerow(["ID", "Name", "Email", "Role", "Approved", "Joined"])
            for u in User.objects.all():
                writer.writerow([u.id, u.get_full_name(), u.email, u.role, u.is_approved, u.created_at.date()])
        elif report_type == "research":
            writer.writerow(["ID", "Title", "Category", "Status", "Author", "Submitted"])
            for r in Research.objects.select_related("author"):
                writer.writerow([r.id, r.title, r.category, r.status, r.author.get_full_name(), r.created_at.date()])

        return response


class AnnouncementListView(generics.ListCreateAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsContentManager]
    queryset = Announcement.objects.all()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class AnnouncementDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsContentManager]
    queryset = Announcement.objects.all()


class NewsListView(generics.ListCreateAPIView):
    serializer_class = NewsPostSerializer
    permission_classes = [IsContentManager]
    queryset = NewsPost.objects.all()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class NewsDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NewsPostSerializer
    permission_classes = [IsContentManager]
    queryset = NewsPost.objects.all()
    lookup_field = "slug"

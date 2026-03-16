from django.urls import path
from . import views

urlpatterns = [
    # ── Dashboard & reports ───────────────────────────────────────────────────
    path("dashboard/", views.DashboardStatsView.as_view(), name="admin-dashboard"),
    path("reports/export/", views.ExportReportView.as_view(), name="export-report"),
    path("reports/history/", views.ReportExportListView.as_view(), name="report-history"),
    path("audit-log/", views.AuditLogListView.as_view(), name="audit-log"),

    # ── Public content ────────────────────────────────────────────────────────
    path("announcements/public/", views.PublicAnnouncementListView.as_view(), name="public-announcements"),
    path("news/public/", views.PublicNewsListView.as_view(), name="public-news"),
    path("news/public/<slug:slug>/", views.PublicNewsDetailView.as_view(), name="public-news-detail"),

    # ── Admin: announcements CRUD ─────────────────────────────────────────────
    path("announcements/", views.AnnouncementListView.as_view(), name="announcements"),
    path("announcements/<uuid:pk>/", views.AnnouncementDetailView.as_view(), name="announcement-detail"),

    # ── Admin: news/blog CRUD ─────────────────────────────────────────────────
    path("news/", views.NewsListView.as_view(), name="news-list"),
    path("news/<slug:slug>/", views.NewsDetailView.as_view(), name="news-detail"),
    path("news/<uuid:pk>/send-blast/", views.NewsBlastView.as_view(), name="news-blast"),

    # ── Admin: announcement blast ─────────────────────────────────────────────
    path("announcements/<uuid:pk>/send-blast/",
         views.AnnouncementBlastView.as_view(), name="announcement-blast"),

    # ── Admin: contact inquiries ──────────────────────────────────────────────
    path("contacts/", views.AdminContactListView.as_view(), name="admin-contacts"),
    path("contacts/<uuid:pk>/resolve/", views.AdminContactResolveView.as_view(), name="admin-contact-resolve"),
]

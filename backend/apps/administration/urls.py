from django.urls import path
from . import views

urlpatterns = [
    # Dashboard stats
    path("dashboard/", views.DashboardStatsView.as_view(), name="admin-dashboard"),
    path("reports/export/", views.ExportReportView.as_view(), name="export-report"),
    # Content management
    path("announcements/", views.AnnouncementListView.as_view(), name="announcements"),
    path("announcements/<uuid:pk>/", views.AnnouncementDetailView.as_view(), name="announcement-detail"),
    path("news/", views.NewsListView.as_view(), name="news-list"),
    path("news/<slug:slug>/", views.NewsDetailView.as_view(), name="news-detail"),
]

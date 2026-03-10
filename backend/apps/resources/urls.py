from django.urls import path
from . import views

urlpatterns = [
    # ── Public: resources ────────────────────────────────────────────────────
    path("", views.ResourceListView.as_view(), name="resource-list"),
    path("<uuid:pk>/", views.ResourceDetailView.as_view(), name="resource-detail"),
    path("<uuid:pk>/download/", views.ResourceDownloadView.as_view(), name="resource-download"),

    # ── Public: webinars ─────────────────────────────────────────────────────
    path("webinars/", views.WebinarListView.as_view(), name="webinar-list"),
    path("webinars/<uuid:pk>/", views.WebinarDetailView.as_view(), name="webinar-detail"),

    # ── Admin: resources CRUD ─────────────────────────────────────────────────
    path("admin/resources/", views.AdminResourceListCreateView.as_view(), name="admin-resource-list"),
    path("admin/resources/<uuid:pk>/", views.AdminResourceDetailView.as_view(), name="admin-resource-detail"),

    # ── Admin: webinars CRUD ──────────────────────────────────────────────────
    path("admin/webinars/", views.AdminWebinarListCreateView.as_view(), name="admin-webinar-list"),
    path("admin/webinars/<uuid:pk>/", views.AdminWebinarDetailView.as_view(), name="admin-webinar-detail"),
]

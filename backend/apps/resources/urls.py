from django.urls import path
from . import views

urlpatterns = [
    path("", views.ResourceListView.as_view(), name="resource-list"),
    path("<uuid:pk>/", views.ResourceDetailView.as_view(), name="resource-detail"),
    path("webinars/", views.WebinarListView.as_view(), name="webinar-list"),
    path("webinars/<uuid:pk>/", views.WebinarDetailView.as_view(), name="webinar-detail"),
    path("admin/", views.ResourceAdminView.as_view(), name="resource-admin"),
]

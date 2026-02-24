from django.urls import path
from . import views

urlpatterns = [
    path("", views.EventListView.as_view(), name="event-list"),
    path("<uuid:pk>/", views.EventDetailView.as_view(), name="event-detail"),
    path("<uuid:pk>/register/", views.EventRegisterView.as_view(), name="event-register"),
    path("<uuid:pk>/scores/", views.JudgeScoreView.as_view(), name="judge-score"),
    path("<uuid:pk>/certificate/", views.CertificateView.as_view(), name="certificate"),
    path("admin/create/", views.EventCreateView.as_view(), name="event-create"),
    path("admin/<uuid:pk>/", views.EventAdminDetailView.as_view(), name="event-admin-detail"),
]

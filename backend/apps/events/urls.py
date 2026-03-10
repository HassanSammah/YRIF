from django.urls import path
from . import views

urlpatterns = [
    # Public
    path("", views.EventListView.as_view(), name="event-list"),
    path("my/", views.MyRegistrationsView.as_view(), name="my-registrations"),
    path("certificates/", views.MyCertificatesView.as_view(), name="my-certificates"),
    # Admin list (before <pk>)
    path("admin/", views.AdminEventListView.as_view(), name="admin-event-list"),
    path("admin/create/", views.EventCreateView.as_view(), name="event-create"),
    path("admin/<uuid:pk>/", views.EventAdminDetailView.as_view(), name="event-admin-detail"),
    path("admin/<uuid:pk>/publish/", views.EventPublishView.as_view(), name="event-publish"),
    path("admin/<uuid:pk>/registrations/", views.AdminEventRegistrationsView.as_view(), name="event-registrations"),
    path("admin/<uuid:pk>/winners/", views.AdminPublishWinnersView.as_view(), name="event-winners-publish"),
    path("admin/registrations/<uuid:reg_pk>/status/", views.AdminUpdateRegistrationStatusView.as_view(), name="registration-status"),
    # Per-event (public)
    path("<uuid:pk>/", views.EventDetailView.as_view(), name="event-detail"),
    path("<uuid:pk>/register/", views.EventRegisterView.as_view(), name="event-register"),
    path("<uuid:pk>/unregister/", views.EventUnregisterView.as_view(), name="event-unregister"),
    path("<uuid:pk>/winners/", views.EventWinnersView.as_view(), name="event-winners"),
    # Scoring & certificates
    path("registrations/<uuid:reg_pk>/score/", views.JudgeScoreView.as_view(), name="judge-score"),
    path("registrations/<uuid:reg_pk>/certificate/", views.CertificateDownloadView.as_view(), name="certificate-download"),
]

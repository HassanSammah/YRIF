from django.urls import path
from . import views

urlpatterns = [
    # ── Public directory ──────────────────────────────────────────────────────
    path("mentors/", views.MentorListView.as_view(), name="mentor-list"),
    path("mentors/<uuid:pk>/", views.MentorDetailView.as_view(), name="mentor-detail"),
    path("partners/", views.PartnerNetworkView.as_view(), name="partner-list"),

    # ── Mentorship requests ───────────────────────────────────────────────────
    path("requests/", views.MentorshipRequestListCreateView.as_view(), name="mentorship-request-list"),
    path("requests/<uuid:pk>/", views.MentorshipRequestDetailView.as_view(), name="mentorship-request-detail"),
    path("requests/<uuid:pk>/match/", views.MatchCreateView.as_view(), name="mentorship-match-create"),

    # ── Mentorship matches ────────────────────────────────────────────────────
    path("matches/", views.MentorshipMatchListView.as_view(), name="mentorship-match-list"),
    path("matches/<uuid:pk>/", views.MentorshipMatchDetailView.as_view(), name="mentorship-match-detail"),

    # ── Feedback ──────────────────────────────────────────────────────────────
    path("matches/<uuid:pk>/feedback/", views.MatchFeedbackCreateView.as_view(), name="match-feedback-create"),
    path("matches/<uuid:pk>/feedback/list/", views.MatchFeedbackListView.as_view(), name="match-feedback-list"),
]

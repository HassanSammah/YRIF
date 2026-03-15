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
    path("requests/<uuid:pk>/accept/", views.MentorAcceptView.as_view(), name="mentorship-request-accept"),
    path("requests/<uuid:pk>/decline/", views.MentorDeclineView.as_view(), name="mentorship-request-decline"),

    # ── Mentorship matches ────────────────────────────────────────────────────
    path("matches/", views.MentorshipMatchListView.as_view(), name="mentorship-match-list"),
    path("matches/<uuid:pk>/", views.MentorshipMatchDetailView.as_view(), name="mentorship-match-detail"),

    # ── Feedback ──────────────────────────────────────────────────────────────
    path("matches/<uuid:pk>/feedback/", views.MatchFeedbackCreateView.as_view(), name="match-feedback-create"),
    path("matches/<uuid:pk>/feedback/list/", views.MatchFeedbackListView.as_view(), name="match-feedback-list"),

    # ── Research assistant directory ──────────────────────────────────────────
    path("research-assistants/", views.RAListView.as_view(), name="ra-list"),
    path("research-assistants/<uuid:pk>/", views.RADetailView.as_view(), name="ra-detail"),

    # ── Collaboration requests ────────────────────────────────────────────────
    path("collab-requests/", views.CollabRequestListCreateView.as_view(), name="collab-request-list"),
    path("collab-requests/<uuid:pk>/accept/", views.RAAcceptCollabView.as_view(), name="collab-request-accept"),
    path("collab-requests/<uuid:pk>/decline/", views.RADeclineCollabView.as_view(), name="collab-request-decline"),

    # ── Collaborations ────────────────────────────────────────────────────────
    path("collaborations/", views.CollaborationListView.as_view(), name="collaboration-list"),
    path("collaborations/<uuid:pk>/", views.CollaborationDetailView.as_view(), name="collaboration-detail"),
]

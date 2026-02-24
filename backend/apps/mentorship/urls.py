from django.urls import path
from . import views

urlpatterns = [
    path("mentors/", views.MentorListView.as_view(), name="mentor-list"),
    path("mentors/<uuid:pk>/", views.MentorDetailView.as_view(), name="mentor-detail"),
    path("requests/", views.MentorshipRequestView.as_view(), name="mentorship-request"),
    path("requests/<uuid:pk>/match/", views.MatchMentorView.as_view(), name="mentor-match"),
    path("requests/<uuid:pk>/feedback/", views.FeedbackView.as_view(), name="mentor-feedback"),
]

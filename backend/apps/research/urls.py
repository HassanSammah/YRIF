from django.urls import path
from . import views

urlpatterns = [
    path("", views.ResearchListView.as_view(), name="research-list"),
    path("submit/", views.ResearchSubmitView.as_view(), name="research-submit"),
    path("my/", views.MyResearchView.as_view(), name="my-research"),
    path("<uuid:pk>/", views.ResearchDetailView.as_view(), name="research-detail"),
    path("<uuid:pk>/review/", views.ResearchReviewView.as_view(), name="research-review"),
    path("<uuid:pk>/download/", views.ResearchDownloadView.as_view(), name="research-download"),
]

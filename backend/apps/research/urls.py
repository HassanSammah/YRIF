from django.urls import path
from . import views

urlpatterns = [
    # Public list + admin list (before <pk> patterns)
    path("", views.ResearchListView.as_view(), name="research-list"),
    path("admin/", views.AdminResearchListView.as_view(), name="research-admin-list"),
    path("my/", views.MyResearchView.as_view(), name="my-research"),
    path("create/", views.ResearchCreateView.as_view(), name="research-create"),
    # Per-item actions (dynamic uuid)
    path("<uuid:pk>/", views.ResearchDetailView.as_view(), name="research-detail"),
    path("<uuid:pk>/update/", views.ResearchUpdateView.as_view(), name="research-update"),
    path("<uuid:pk>/submit/", views.ResearchSubmitView.as_view(), name="research-submit"),
    path("<uuid:pk>/assign-reviewer/", views.ResearchAssignReviewerView.as_view(), name="research-assign-reviewer"),
    path("<uuid:pk>/comment/", views.ResearchCommentView.as_view(), name="research-comment"),
    path("<uuid:pk>/decide/", views.ResearchDecideView.as_view(), name="research-decide"),
    path("<uuid:pk>/publish/", views.ResearchPublishView.as_view(), name="research-publish"),
    path("<uuid:pk>/download/", views.ResearchDownloadView.as_view(), name="research-download"),
]

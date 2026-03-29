from django.urls import path
from . import views

urlpatterns = [
    path("stats/", views.PublicStatsView.as_view(), name="public-stats"),
    path("vacancies/", views.VacancyListView.as_view(), name="vacancy-list"),
    path("donations/", views.DonationCreateView.as_view(), name="donation-create"),
]

from django.urls import path
from . import views

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("me/", views.CurrentUserView.as_view(), name="me"),
    path("profile/", views.ProfileView.as_view(), name="profile"),
    path("users/", views.UserListView.as_view(), name="user-list"),
    path("users/<uuid:pk>/approve/", views.ApproveUserView.as_view(), name="approve-user"),
    path("users/<uuid:pk>/", views.UserDetailView.as_view(), name="user-detail"),
]

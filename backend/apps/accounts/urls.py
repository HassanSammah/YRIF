from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # ── Registration & standard auth ──────────────────────────────────────────
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    # ── Social auth ───────────────────────────────────────────────────────────
    path("google/", views.GoogleAuthView.as_view(), name="google-auth"),
    # ── Phone OTP (Briq) ──────────────────────────────────────────────────────
    path("phone/request-otp/", views.PhoneOTPRequestView.as_view(), name="phone-otp-request"),
    path("phone/verify-otp/", views.PhoneOTPVerifyView.as_view(), name="phone-otp-verify"),
    # ── Current user ──────────────────────────────────────────────────────────
    path("me/", views.CurrentUserView.as_view(), name="me"),
    # ── Profile (base + role-specific) ───────────────────────────────────────
    path("profile/", views.ProfileView.as_view(), name="profile"),
    path("profile/mentor/", views.MentorProfileView.as_view(), name="mentor-profile"),
    path("profile/partner/", views.PartnerProfileView.as_view(), name="partner-profile"),
    path("profile/assistant/", views.ResearchAssistantProfileView.as_view(), name="ra-profile"),
    # ── Admin: user management ────────────────────────────────────────────────
    path("users/", views.UserListView.as_view(), name="user-list"),
    path("users/<uuid:pk>/status/", views.UserStatusUpdateView.as_view(), name="user-status"),
    path("users/<uuid:pk>/role/", views.RoleAssignmentView.as_view(), name="user-role"),
    path("users/<uuid:pk>/", views.UserDetailView.as_view(), name="user-detail"),
]

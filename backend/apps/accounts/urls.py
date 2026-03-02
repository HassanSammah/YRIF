from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Registration & standard auth
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    # Social auth
    path("google/", views.GoogleAuthView.as_view(), name="google-auth"),
    # Phone OTP via Briq
    path("phone/request-otp/", views.PhoneOTPRequestView.as_view(), name="phone-otp-request"),
    path("phone/verify-otp/", views.PhoneOTPVerifyView.as_view(), name="phone-otp-verify"),
    # User profile & management
    path("me/", views.CurrentUserView.as_view(), name="me"),
    path("profile/", views.ProfileView.as_view(), name="profile"),
    path("users/", views.UserListView.as_view(), name="user-list"),
    path("users/<uuid:pk>/approve/", views.ApproveUserView.as_view(), name="approve-user"),
    path("users/<uuid:pk>/", views.UserDetailView.as_view(), name="user-detail"),
]

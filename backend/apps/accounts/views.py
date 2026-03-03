import requests as http_requests
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.conf import settings
from apps.core.permissions import IsAdmin
from .models import (
    User, UserStatus, UserRole,
    Profile, MentorProfile, PartnerProfile, ResearchAssistantProfile,
    AuthProviderAccount,
)
from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    ProfileSerializer,
    MentorProfileSerializer,
    PartnerProfileSerializer,
    ResearchAssistantProfileSerializer,
    LoginSerializer,
    GoogleAuthSerializer,
    PhoneOTPRequestSerializer,
    PhoneOTPVerifySerializer,
    UpdateUserStatusSerializer,
    RoleAssignmentSerializer,
)
from . import emails as account_emails


def _get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


# ─── Registration & Auth ──────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        account_emails.notify_admin_new_registration(user)
        return Response(
            {"detail": "Account created. Await admin approval.", "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        tokens = _get_tokens(user)
        return Response({**tokens, "user": UserSerializer(user).data})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "Refresh token required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_204_NO_CONTENT)


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        credential = serializer.validated_data["credential"]

        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests

            idinfo = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError as exc:
            return Response({"detail": f"Invalid Google credential: {exc}"}, status=status.HTTP_400_BAD_REQUEST)

        email = idinfo.get("email")
        if not email:
            return Response({"detail": "Google token missing email."}, status=status.HTTP_400_BAD_REQUEST)

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "first_name": idinfo.get("given_name", ""),
                "last_name": idinfo.get("family_name", ""),
            },
        )
        if created:
            user.set_unusable_password()
            user.save()
            Profile.objects.create(user=user)
            account_emails.notify_admin_new_registration(user)

        # Always upsert the provider account record
        AuthProviderAccount.objects.update_or_create(
            user=user,
            provider=AuthProviderAccount.PROVIDER_GOOGLE,
            defaults={
                "provider_uid": idinfo.get("sub", ""),
                "provider_email": email,
                "provider_data": {
                    "picture": idinfo.get("picture", ""),
                    "name": idinfo.get("name", ""),
                },
            },
        )

        tokens = _get_tokens(user)
        return Response({**tokens, "user": UserSerializer(user).data, "is_new": created})


# ─── Phone OTP (Briq) ─────────────────────────────────────────────────────────

class PhoneOTPRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PhoneOTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone_number = serializer.validated_data["phone_number"]

        if not settings.BRIQ_API_KEY:
            return Response({"detail": "OTP service not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            resp = http_requests.post(
                f"{settings.BRIQ_BASE_URL}/v1/otp/request",
                json={
                    "phone_number": phone_number,
                    "app_key": settings.BRIQ_APP_KEY,
                    "sender_id": settings.BRIQ_SMS_SENDER,
                    "minutes_to_expire": 10,
                },
                headers={"X-API-Key": settings.BRIQ_API_KEY, "Content-Type": "application/json"},
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()
        except http_requests.RequestException as exc:
            return Response({"detail": f"OTP request failed: {exc}"}, status=status.HTTP_502_BAD_GATEWAY)

        if not data.get("success"):
            return Response({"detail": data.get("message", "OTP request failed.")}, status=status.HTTP_400_BAD_REQUEST)

        profile, _ = Profile.objects.get_or_create(user=request.user)
        profile.phone = phone_number
        profile.save(update_fields=["phone"])
        return Response({"detail": "OTP sent successfully."})


class PhoneOTPVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PhoneOTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone_number = serializer.validated_data["phone_number"]
        code = serializer.validated_data["code"]

        if not settings.BRIQ_API_KEY:
            return Response({"detail": "OTP service not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            resp = http_requests.post(
                f"{settings.BRIQ_BASE_URL}/v1/otp/verify",
                json={
                    "phone_number": phone_number,
                    "app_key": settings.BRIQ_APP_KEY,
                    "code": code,
                },
                headers={"X-API-Key": settings.BRIQ_API_KEY, "Content-Type": "application/json"},
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()
        except http_requests.RequestException as exc:
            return Response({"detail": f"OTP verification failed: {exc}"}, status=status.HTTP_502_BAD_GATEWAY)

        if not data.get("success"):
            return Response({"detail": data.get("message", "Invalid OTP.")}, status=status.HTTP_400_BAD_REQUEST)

        profile, _ = Profile.objects.get_or_create(user=request.user)
        profile.phone_verified = True
        profile.save(update_fields=["phone_verified"])
        return Response({"detail": "Phone verified successfully."})


# ─── User Profile ─────────────────────────────────────────────────────────────

class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        profile, _ = Profile.objects.get_or_create(user=self.request.user)
        return profile


class MentorProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = MentorProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        if self.request.user.role != UserRole.MENTOR:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only mentors have a mentor profile.")
        profile, _ = MentorProfile.objects.get_or_create(user=self.request.user)
        return profile


class PartnerProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = PartnerProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        if self.request.user.role != UserRole.INDUSTRY_PARTNER:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only industry/community partners have a partner profile.")
        profile, _ = PartnerProfile.objects.get_or_create(user=self.request.user)
        return profile


class ResearchAssistantProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ResearchAssistantProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        if self.request.user.role != UserRole.RESEARCH_ASSISTANT:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only research assistants have this profile.")
        profile, _ = ResearchAssistantProfile.objects.get_or_create(user=self.request.user)
        return profile


# ─── Admin: User Management ───────────────────────────────────────────────────

class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    queryset = User.objects.all().select_related(
        "profile", "mentor_profile", "partner_profile", "ra_profile"
    )
    filterset_fields = ["role", "status"]
    search_fields = ["email", "first_name", "last_name"]
    ordering_fields = ["created_at", "first_name"]
    ordering = ["-created_at"]


class UserStatusUpdateView(APIView):
    """Admin: approve, reject, or suspend a user account."""
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        user = generics.get_object_or_404(User, pk=pk)
        serializer = UpdateUserStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]
        reason = serializer.validated_data.get("reason", "")

        if new_status == UserStatus.ACTIVE:
            user.activate()
            account_emails.notify_user_approved(user)
        elif new_status == UserStatus.REJECTED:
            user.reject()
            account_emails.notify_user_rejected(user, reason=reason)
        elif new_status == UserStatus.SUSPENDED:
            user.suspend()
            account_emails.notify_user_suspended(user)

        return Response({"detail": f"User status updated to {new_status}.", "user": UserSerializer(user).data})


class RoleAssignmentView(APIView):
    """Admin: change a user's role."""
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        user = generics.get_object_or_404(User, pk=pk)
        serializer = RoleAssignmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_role = serializer.validated_data["role"]
        user.role = new_role
        user.save(update_fields=["role", "updated_at"])
        return Response({"detail": f"Role updated to {new_role}.", "user": UserSerializer(user).data})


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    queryset = User.objects.all().select_related(
        "profile", "mentor_profile", "partner_profile", "ra_profile"
    )

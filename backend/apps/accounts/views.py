import logging
import random
import uuid
import requests as http_requests
from django.core.cache import cache
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.conf import settings
from apps.core.permissions import IsAdmin
from django.utils import timezone as dj_timezone
from .models import (
    User, UserStatus, UserRole,
    Profile, MentorProfile, PartnerProfile, ResearchAssistantProfile,
    AuthProviderAccount, DeletionRequest, DeletionRequestStatus,
)
from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    AdminUserUpdateSerializer,
    ProfileSerializer,
    MentorProfileSerializer,
    PartnerProfileSerializer,
    ResearchAssistantProfileSerializer,
    LoginSerializer,
    GoogleAuthSerializer,
    PhoneOTPRequestSerializer,
    PhoneOTPVerifySerializer,
    EmailVerifySerializer,
    BriqAuthRequestSerializer,
    BriqAuthVerifySerializer,
    BriqAuthCompleteSerializer,
    CompleteProfileSerializer,
    UpdateUserStatusSerializer,
    RoleAssignmentSerializer,
    DeletionRequestSerializer,
)
from . import emails as account_emails

logger = logging.getLogger(__name__)


def _normalise_phone(raw: str) -> str:
    """Return phone in E.164 format (+255XXXXXXXXX) expected by BRIQ."""
    p = raw.strip().replace(' ', '').replace('-', '')
    if p.startswith('0'):
        return '+255' + p[1:]
    if p.startswith('255') and not p.startswith('+'):
        return '+' + p
    if not p.startswith('+'):
        return '+255' + p
    return p


def _extract_otp_id(data):
    """Safely extract otp_id from BRIQ response — handles nested and flat shapes."""
    nested = data.get("data", {})
    if isinstance(nested, dict):
        otp_id = nested.get("otp_id")
        if otp_id:
            return otp_id
    return data.get("otp_id", "")


def _mask_email(email: str) -> str:
    """Mask an email for display: hassan@example.com → ha***n@example.com"""
    local, _, domain = email.partition("@")
    if len(local) <= 2:
        return f"{'*' * len(local)}@{domain}"
    return f"{local[0]}{'*' * (len(local) - 2)}{local[-1]}@{domain}"


def _generate_otp() -> str:
    return f"{random.randint(100000, 999999)}"


def _get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


# ─── Registration & Auth ──────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate and cache a 6-digit OTP, then send verification email
        otp_code = str(random.randint(100000, 999999))
        cache.set(f"email_otp:{user.email}", otp_code, timeout=900)  # 15 minutes
        account_emails.send_email_verification_otp(user, otp_code)

        return Response(
            {
                "detail": "Account created. Please verify your email.",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        tokens = _get_tokens(user)
        return Response({
            **tokens,
            "user": UserSerializer(user).data,
            "email_verified": user.status != UserStatus.PENDING_EMAIL_VERIFICATION,
        })


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
    authentication_classes = []

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        credential = serializer.validated_data.get("credential")
        access_token = serializer.validated_data.get("access_token")

        try:
            if credential:
                from google.oauth2 import id_token
                from google.auth.transport import requests as google_requests

                idinfo = id_token.verify_oauth2_token(
                    credential,
                    google_requests.Request(),
                    settings.GOOGLE_CLIENT_ID,
                )
            else:
                resp = http_requests.get(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=5,
                )
                if resp.status_code != 200:
                    return Response({"detail": "Invalid Google access token."}, status=status.HTTP_400_BAD_REQUEST)
                idinfo = resp.json()
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
            # Google verifies email — set ACTIVE immediately
            user.status = UserStatus.ACTIVE
            user.save(update_fields=["status", "updated_at"])
            Profile.objects.create(user=user)

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
        serializer = PhoneOTPRequestSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        phone_number = _normalise_phone(serializer.validated_data["phone_number"])

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

        otp_id = _extract_otp_id(data)
        cache.set(f"briq_otp:{phone_number}", otp_id, timeout=900)  # 15 minutes

        profile, _ = Profile.objects.get_or_create(user=request.user)
        profile.phone = phone_number
        profile.save(update_fields=["phone"])
        return Response({"detail": "OTP sent.", "otp_id": otp_id})


class PhoneOTPVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PhoneOTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone_number = _normalise_phone(serializer.validated_data["phone_number"])
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

        cache.delete(f"briq_otp:{phone_number}")
        profile, _ = Profile.objects.get_or_create(user=request.user)
        profile.phone_verified = True
        profile.save(update_fields=["phone_verified"])
        return Response({"detail": "Phone verified successfully."})


# ─── Email Verification ───────────────────────────────────────────────────────

class SendEmailOTPView(APIView):
    """POST /auth/verify-email/send/ — (re)send a 6-digit email verification OTP."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal whether the email exists
            return Response({"detail": "If that email is registered, a verification code has been sent."})

        if user.status != UserStatus.PENDING_EMAIL_VERIFICATION:
            return Response({"detail": "This email has already been verified."}, status=status.HTTP_400_BAD_REQUEST)

        otp_code = str(random.randint(100000, 999999))
        cache.set(f"email_otp:{email}", otp_code, timeout=900)  # 15 minutes
        account_emails.send_email_verification_otp(user, otp_code)
        return Response({"detail": "If that email is registered, a verification code has been sent."})


class VerifyEmailView(APIView):
    """POST /auth/verify-email/ — verify the 6-digit code and move user to ACTIVE."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = EmailVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        code = serializer.validated_data["code"]

        cached_code = cache.get(f"email_otp:{email}")
        if not cached_code or cached_code != code:
            return Response({"detail": "Invalid or expired verification code."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        # Delete OTP first to prevent double-use via race condition
        cache.delete(f"email_otp:{email}")

        was_pending = user.status == UserStatus.PENDING_EMAIL_VERIFICATION
        if was_pending:
            user.status = UserStatus.ACTIVE
            user.is_active = True
            user.save(update_fields=["status", "is_active", "updated_at"])
            account_emails.send_post_verification_welcome_email(user)
        tokens = _get_tokens(user)
        return Response({
            **tokens,
            "user": UserSerializer(user).data,
            "detail": "Email verified successfully.",
        })


# ─── Briq Auth — phone-first login/signup (unauthenticated) ──────────────────

class BriqAuthRequestView(APIView):
    """POST /auth/briq/request/ — send OTP to phone for login or new account signup.

    Falls back to email OTP if BRIQ SMS is unavailable.
    Optional body field `email` enables email fallback for new (unknown) phone numbers.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = BriqAuthRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone_number = _normalise_phone(serializer.validated_data["phone_number"])
        fallback_email = serializer.validated_data.get("email", "").strip()

        if not settings.BRIQ_API_KEY:
            return Response({"detail": "OTP service not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # ── Try BRIQ (primary) ────────────────────────────────────────────────
        briq_ok = False
        briq_data = {}
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
            briq_data = resp.json()
            briq_ok = bool(briq_data.get("success"))
        except http_requests.RequestException as exc:
            logger.warning("BRIQ OTP unavailable, trying email fallback: %s", exc)

        if briq_ok:
            otp_id = _extract_otp_id(briq_data)
            cache.set(f"briq_auth:{phone_number}", otp_id, timeout=900)
            cache.delete(f"email_otp:{phone_number}")  # clear any stale email OTP
            return Response({"detail": "OTP sent.", "otp_id": otp_id, "method": "sms"})

        # ── Email fallback ────────────────────────────────────────────────────
        email = fallback_email
        if not email:
            profile = Profile.objects.filter(phone=phone_number).exclude(phone="").select_related("user").first()
            if profile and profile.user.email:
                email = profile.user.email

        if not email:
            return Response({
                "method": "email_required",
                "detail": "SMS is temporarily unavailable. Please provide your email to receive a login code.",
            })

        otp_code = _generate_otp()
        cache.set(f"email_otp:{phone_number}", {"code": otp_code, "email": email}, timeout=600)
        try:
            account_emails.send_otp_email_fallback(email=email, otp_code=otp_code)
        except Exception as exc:
            logger.error("Email OTP fallback send failed: %s", exc)
            return Response(
                {"detail": "SMS unavailable and email delivery failed. Please use email login instead."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response({
            "method": "email",
            "otp_id": "",
            "masked_email": _mask_email(email),
            "detail": f"SMS unavailable. A login code was sent to {_mask_email(email)}.",
        })


class BriqAuthVerifyView(APIView):
    """POST /auth/briq/verify/ — verify OTP; log in existing user or prompt new user to register.

    Checks email OTP cache first (fallback path), then BRIQ (primary path).
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = BriqAuthVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone_number = _normalise_phone(serializer.validated_data["phone_number"])
        code = serializer.validated_data["code"]

        if not settings.BRIQ_API_KEY:
            return Response({"detail": "OTP service not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # ── Check email OTP path first ────────────────────────────────────────
        email_otp = cache.get(f"email_otp:{phone_number}")
        if email_otp:
            if email_otp["code"] != code:
                return Response({"detail": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)
            cache.delete(f"email_otp:{phone_number}")
            # Fall through to user lookup below

        else:
            # ── BRIQ verify path ──────────────────────────────────────────────
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
            except http_requests.RequestException:
                return Response(
                    {"detail": "OTP verification unavailable. Please try again."},
                    status=status.HTTP_502_BAD_GATEWAY,
                )

            if not data.get("success"):
                return Response({"detail": data.get("message", "Invalid OTP.")}, status=status.HTTP_400_BAD_REQUEST)
            cache.delete(f"briq_auth:{phone_number}")

        # ── Common: look up or prepare new user ───────────────────────────────
        # Check whether this phone belongs to an existing user (verified or not —
        # successful OTP proves ownership, so we accept either state)
        profile_qs = Profile.objects.filter(phone=phone_number).exclude(phone="").select_related("user")
        if profile_qs.exists():
            profile = profile_qs.first()
            user = profile.user
            if not user.is_active:
                return Response(
                    {"detail": "Your account has been suspended or rejected. Contact support."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            # Mark phone as verified since OTP was just proven
            if not profile.phone_verified:
                profile.phone_verified = True
                profile.save(update_fields=["phone_verified"])
            tokens = _get_tokens(user)
            return Response({**tokens, "user": UserSerializer(user).data, "needs_registration": False})

        # New phone number — issue a short-lived verify_token so the frontend can complete signup
        verify_token = str(uuid.uuid4())
        cache.set(f"briq_verified:{phone_number}", verify_token, timeout=1800)  # 30 minutes
        return Response({
            "needs_registration": True,
            "verify_token": verify_token,
            "phone_number": phone_number,
        })


class BriqAuthCompleteView(APIView):
    """POST /auth/briq/complete/ — finish signup for new users after phone verification."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = BriqAuthCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone_number = _normalise_phone(serializer.validated_data["phone_number"])
        verify_token = serializer.validated_data["verify_token"]

        # Validate the verify_token issued in BriqAuthVerifyView
        cached_token = cache.get(f"briq_verified:{phone_number}")
        if not cached_token or cached_token != verify_token:
            return Response(
                {"detail": "Phone verification token is invalid or expired. Please verify your phone again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create user — phone already verified, set ACTIVE immediately
        user = User.objects.create_user(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
            first_name=serializer.validated_data["first_name"],
            last_name=serializer.validated_data["last_name"],
            role=serializer.validated_data["role"],
            status=UserStatus.ACTIVE,
        )

        # Create profile with phone already verified
        Profile.objects.create(user=user, phone=phone_number, phone_verified=True)

        # Create role-specific extended profile
        if user.role == UserRole.MENTOR:
            MentorProfile.objects.create(user=user)
        elif user.role == UserRole.INDUSTRY_PARTNER:
            PartnerProfile.objects.create(user=user)
        elif user.role == UserRole.RESEARCH_ASSISTANT:
            ResearchAssistantProfile.objects.create(user=user)

        # Link BRIQ auth provider
        AuthProviderAccount.objects.create(
            user=user,
            provider=AuthProviderAccount.PROVIDER_BRIQ,
            provider_uid=phone_number,
        )

        cache.delete(f"briq_verified:{phone_number}")
        account_emails.send_welcome_email(user)

        tokens = _get_tokens(user)
        return Response(
            {**tokens, "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class CompleteProfileView(APIView):
    """POST /auth/complete-profile/ — Google new users set their role after sign-in."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CompleteProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        role = serializer.validated_data["role"]
        first_name = serializer.validated_data.get("first_name", "").strip()
        last_name  = serializer.validated_data.get("last_name", "").strip()

        update_fields = ["role", "updated_at"]
        user.role = role
        if first_name:
            user.first_name = first_name
            update_fields.append("first_name")
        if last_name:
            user.last_name = last_name
            update_fields.append("last_name")
        user.save(update_fields=update_fields)

        if role == UserRole.MENTOR:
            MentorProfile.objects.get_or_create(user=user)
        elif role == UserRole.INDUSTRY_PARTNER:
            PartnerProfile.objects.get_or_create(user=user)
        elif role == UserRole.RESEARCH_ASSISTANT:
            ResearchAssistantProfile.objects.get_or_create(user=user)

        return Response({"user": UserSerializer(user).data})


# ─── User Profile ─────────────────────────────────────────────────────────────

class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'put', 'patch', 'head', 'options']

    def get_object(self):
        profile, _ = Profile.objects.get_or_create(user=self.request.user)
        return profile

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


class MentorProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = MentorProfileSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'put', 'patch', 'head', 'options']

    def get_object(self):
        if self.request.user.role != UserRole.MENTOR:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only mentors have a mentor profile.")
        profile, _ = MentorProfile.objects.get_or_create(user=self.request.user)
        return profile

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


class PartnerProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = PartnerProfileSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'put', 'patch', 'head', 'options']

    def get_object(self):
        if self.request.user.role != UserRole.INDUSTRY_PARTNER:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only industry/community partners have a partner profile.")
        profile, _ = PartnerProfile.objects.get_or_create(user=self.request.user)
        return profile

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


class ResearchAssistantProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ResearchAssistantProfileSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'put', 'patch', 'head', 'options']

    def get_object(self):
        if self.request.user.role != UserRole.RESEARCH_ASSISTANT:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only research assistants have this profile.")
        profile, _ = ResearchAssistantProfile.objects.get_or_create(user=self.request.user)
        return profile

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


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
    permission_classes = [IsAdmin]
    queryset = User.objects.all().select_related(
        "profile", "mentor_profile", "partner_profile", "ra_profile"
    )

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return AdminUserUpdateSerializer
        return UserSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            instance.delete()
        except Exception as exc:
            return Response(
                {"detail": f"Could not delete user: {exc}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Email Change ─────────────────────────────────────────────────────────────

class ChangeEmailView(APIView):
    """POST /auth/change-email/ — send OTP to new email for verification."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_email = request.data.get("new_email", "").strip().lower()
        if not new_email:
            return Response({"detail": "new_email is required."}, status=status.HTTP_400_BAD_REQUEST)

        from django.core.validators import validate_email as django_validate_email
        from django.core.exceptions import ValidationError as DjangoValidationError
        try:
            django_validate_email(new_email)
        except DjangoValidationError:
            return Response({"detail": "Enter a valid email address."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=new_email).exclude(pk=request.user.pk).exists():
            return Response({"detail": "This email is already in use."}, status=status.HTTP_400_BAD_REQUEST)

        otp_code = str(random.randint(100000, 999999))
        cache.set(f"email_change_otp:{request.user.id}:{new_email}", otp_code, timeout=900)
        cache.set(f"email_change_pending:{request.user.id}", new_email, timeout=900)
        account_emails.send_email_change_otp(request.user, new_email, otp_code)
        return Response({"detail": "Verification code sent to your new email address."})


class ConfirmEmailChangeView(APIView):
    """POST /auth/change-email/confirm/ — verify OTP and update email."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_email = request.data.get("new_email", "").strip().lower()
        code = request.data.get("code", "").strip()

        if not new_email or not code:
            return Response({"detail": "new_email and code are required."}, status=status.HTTP_400_BAD_REQUEST)

        pending = cache.get(f"email_change_pending:{request.user.id}")
        if pending != new_email:
            return Response({"detail": "No pending email change for this address."}, status=status.HTTP_400_BAD_REQUEST)

        cached_code = cache.get(f"email_change_otp:{request.user.id}:{new_email}")
        if not cached_code or cached_code != code:
            return Response({"detail": "Invalid or expired verification code."}, status=status.HTTP_400_BAD_REQUEST)

        request.user.email = new_email
        request.user.save(update_fields=["email", "updated_at"])
        cache.delete(f"email_change_otp:{request.user.id}:{new_email}")
        cache.delete(f"email_change_pending:{request.user.id}")
        return Response({"detail": "Email updated successfully.", "user": UserSerializer(request.user).data})


# ─── Account Deletion Requests ────────────────────────────────────────────────

class DeletionRequestView(APIView):
    """POST /auth/deletion-request/ — authenticated user submits a deletion request."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if DeletionRequest.objects.filter(user=request.user, status=DeletionRequestStatus.PENDING).exists():
            return Response(
                {"detail": "You already have a pending deletion request."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        reason = request.data.get("reason", "")
        deletion_req = DeletionRequest.objects.create(user=request.user, reason=reason)
        return Response(
            DeletionRequestSerializer(deletion_req).data,
            status=status.HTTP_201_CREATED,
        )


class DeletionRequestListView(generics.ListAPIView):
    """GET /auth/deletion-requests/ — admin lists all deletion requests."""
    serializer_class = DeletionRequestSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ["status"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return DeletionRequest.objects.select_related("user", "resolved_by").order_by("-created_at")


class DeletionRequestApproveView(APIView):
    """POST /auth/deletion-requests/<pk>/approve/ — admin approves, deletes user."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        deletion_req = generics.get_object_or_404(
            DeletionRequest.objects.select_related("user"), pk=pk
        )
        if deletion_req.status != DeletionRequestStatus.PENDING:
            return Response(
                {"detail": "This request has already been resolved."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = deletion_req.user
        # Send farewell email before deleting (we still have the email)
        account_emails.send_deletion_approved_email(user)
        # Cascade-delete the user (DeletionRequest has CASCADE so it goes too)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DeletionRequestRejectView(APIView):
    """POST /auth/deletion-requests/<pk>/reject/ — admin rejects deletion request."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        deletion_req = generics.get_object_or_404(
            DeletionRequest.objects.select_related("user"), pk=pk
        )
        if deletion_req.status != DeletionRequestStatus.PENDING:
            return Response(
                {"detail": "This request has already been resolved."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        deletion_req.status = DeletionRequestStatus.REJECTED
        deletion_req.resolved_at = dj_timezone.now()
        deletion_req.resolved_by = request.user
        deletion_req.save(update_fields=["status", "resolved_at", "resolved_by", "updated_at"])
        account_emails.send_deletion_rejected_email(deletion_req.user)
        return Response(DeletionRequestSerializer(deletion_req).data)

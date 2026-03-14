from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import (
    User, UserStatus, UserRole,
    Profile, MentorProfile, PartnerProfile, ResearchAssistantProfile,
    AuthProviderAccount,
)


# ─── Profile Serializers ──────────────────────────────────────────────────────

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        exclude = ["user"]
        read_only_fields = ["id", "created_at", "updated_at", "phone_verified"]


class MentorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = MentorProfile
        exclude = ["user"]
        read_only_fields = ["id", "created_at", "updated_at", "is_verified"]


class PartnerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartnerProfile
        exclude = ["user"]
        read_only_fields = ["id", "created_at", "updated_at", "is_verified"]


class ResearchAssistantProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResearchAssistantProfile
        exclude = ["user"]
        read_only_fields = ["id", "created_at", "updated_at"]


# ─── User Serializers ─────────────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    mentor_profile = MentorProfileSerializer(read_only=True)
    partner_profile = PartnerProfileSerializer(read_only=True)
    ra_profile = ResearchAssistantProfileSerializer(read_only=True)
    is_approved = serializers.BooleanField(read_only=True)
    email_verified = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name",
            "role", "status", "is_approved", "email_verified", "created_at",
            "profile", "mentor_profile", "partner_profile", "ra_profile",
        ]
        read_only_fields = ["id", "created_at", "status", "is_approved", "email_verified"]

    def get_email_verified(self, obj):
        return obj.status != UserStatus.PENDING_EMAIL_VERIFICATION


# External roles that can self-register
_EXTERNAL_ROLES = {
    UserRole.YOUTH, UserRole.RESEARCHER, UserRole.MENTOR,
    UserRole.RESEARCH_ASSISTANT, UserRole.INDUSTRY_PARTNER,
}


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    phone = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = User
        fields = ["email", "first_name", "last_name", "role", "password", "phone"]

    def validate_role(self, value):
        if value not in _EXTERNAL_ROLES:
            raise serializers.ValidationError("Cannot self-register with this role.")
        return value

    def validate_phone(self, value):
        if value:
            qs = Profile.objects.filter(phone=value).exclude(phone="")
            if qs.exists():
                raise serializers.ValidationError("This phone number is already registered.")
        return value

    def create(self, validated_data):
        phone = validated_data.pop("phone", "")
        # Status is set to PENDING_EMAIL_VERIFICATION by UserManager for external roles
        user = User.objects.create_user(**validated_data)
        Profile.objects.create(user=user, phone=phone)
        # Create role-specific extended profile
        if user.role == UserRole.MENTOR:
            MentorProfile.objects.create(user=user)
        elif user.role == UserRole.INDUSTRY_PARTNER:
            PartnerProfile.objects.create(user=user)
        elif user.role == UserRole.RESEARCH_ASSISTANT:
            ResearchAssistantProfile.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get("request"),
            username=attrs["email"],
            password=attrs["password"],
        )
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError(
                "Your account has been suspended or rejected. Contact support."
            )
        attrs["user"] = user
        return attrs


class GoogleAuthSerializer(serializers.Serializer):
    credential = serializers.CharField()


class PhoneOTPRequestSerializer(serializers.Serializer):
    phone_number = serializers.CharField()

    def validate_phone_number(self, value):
        request = self.context.get("request")
        qs = Profile.objects.filter(phone=value).exclude(phone="")
        if qs.exists():
            profile = qs.first()
            if request and request.user.is_authenticated:
                if hasattr(request.user, "profile") and request.user.profile == profile:
                    return value
            raise serializers.ValidationError(
                "This phone number is already registered to another account."
            )
        return value


class PhoneOTPVerifySerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    otp_id = serializers.CharField(required=False, allow_blank=True)
    code = serializers.CharField(min_length=4, max_length=8)


# ─── Email Verification Serializers ──────────────────────────────────────────

class EmailVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(min_length=4, max_length=8)


# ─── Briq Auth (phone-first login/signup) ────────────────────────────────────

class BriqAuthRequestSerializer(serializers.Serializer):
    phone_number = serializers.CharField()


class BriqAuthVerifySerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    otp_id = serializers.CharField(required=False, allow_blank=True)
    code = serializers.CharField(min_length=4, max_length=8)


class BriqAuthCompleteSerializer(serializers.Serializer):
    """Complete signup after phone verification for new users."""
    phone_number = serializers.CharField()
    verify_token = serializers.CharField()  # short-lived token from verify step
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8)
    role = serializers.ChoiceField(choices=[(r.value, r.label) for r in _EXTERNAL_ROLES])

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_phone_number(self, value):
        if Profile.objects.filter(phone=value).exclude(phone="").exists():
            raise serializers.ValidationError("This phone number is already registered.")
        return value


# ─── Admin Serializers ────────────────────────────────────────────────────────

class UpdateUserStatusSerializer(serializers.Serializer):
    STATUS_CHOICES = [
        UserStatus.ACTIVE,
        UserStatus.REJECTED,
        UserStatus.SUSPENDED,
    ]
    status = serializers.ChoiceField(choices=[(s, s) for s in STATUS_CHOICES])
    reason = serializers.CharField(required=False, allow_blank=True)


class RoleAssignmentSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=UserRole.choices)


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """Admin-only: edit basic user fields."""

    class Meta:
        model = User
        fields = ["first_name", "last_name", "role", "status", "is_active"]

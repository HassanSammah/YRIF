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

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name",
            "role", "status", "is_approved", "created_at",
            "profile", "mentor_profile", "partner_profile", "ra_profile",
        ]
        read_only_fields = ["id", "created_at", "status", "is_approved"]


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    phone = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = User
        fields = ["email", "first_name", "last_name", "role", "password", "phone"]

    def validate_role(self, value):
        # External users only can self-register; internal roles created by admin
        external_roles = {
            UserRole.YOUTH, UserRole.RESEARCHER, UserRole.MENTOR,
            UserRole.RESEARCH_ASSISTANT, UserRole.INDUSTRY_PARTNER,
        }
        if value not in external_roles:
            raise serializers.ValidationError("Cannot self-register with this role.")
        return value

    def create(self, validated_data):
        phone = validated_data.pop("phone", "")
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


class PhoneOTPVerifySerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    code = serializers.CharField(min_length=4, max_length=8)


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

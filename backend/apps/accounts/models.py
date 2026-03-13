from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from apps.core.models import BaseModel


class UserRole(models.TextChoices):
    YOUTH = "youth", "Youth/Student"
    RESEARCHER = "researcher", "Young Researcher"
    MENTOR = "mentor", "Mentor"
    RESEARCH_ASSISTANT = "research_assistant", "Research Assistant"
    INDUSTRY_PARTNER = "industry_partner", "Industry/Community Partner"
    ADMIN = "admin", "Admin"
    STAFF = "staff", "YRIF Staff"
    PROGRAM_MANAGER = "program_manager", "Program Manager"
    CONTENT_MANAGER = "content_manager", "Content Manager"
    JUDGE = "judge", "Judge"


class UserStatus(models.TextChoices):
    PENDING_EMAIL_VERIFICATION = "pending_email", "Pending Email Verification"
    PENDING_APPROVAL = "pending_approval", "Pending Approval"
    ACTIVE = "active", "Active"
    SUSPENDED = "suspended", "Suspended"
    REJECTED = "rejected", "Rejected"


# Internal roles that are auto-approved on creation
AUTO_APPROVED_ROLES = {
    UserRole.ADMIN,
    UserRole.STAFF,
    UserRole.PROGRAM_MANAGER,
}


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        role = extra_fields.get("role", UserRole.YOUTH)
        if "status" not in extra_fields:
            if role in AUTO_APPROVED_ROLES:
                extra_fields["status"] = UserStatus.ACTIVE
            else:
                extra_fields["status"] = UserStatus.PENDING_EMAIL_VERIFICATION
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", UserRole.ADMIN)
        extra_fields.setdefault("status", UserStatus.ACTIVE)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    role = models.CharField(max_length=30, choices=UserRole.choices, default=UserRole.YOUTH)
    status = models.CharField(
        max_length=20,
        choices=UserStatus.choices,
        default=UserStatus.PENDING_EMAIL_VERIFICATION,
        db_index=True,
    )
    is_active = models.BooleanField(default=True)  # Django auth — False = cannot log in
    is_staff = models.BooleanField(default=False)  # Django admin access

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = UserManager()

    @property
    def is_approved(self) -> bool:
        """Convenience property; True when account is ACTIVE."""
        return self.status == UserStatus.ACTIVE

    def activate(self):
        self.status = UserStatus.ACTIVE
        self.is_active = True
        self.save(update_fields=["status", "is_active", "updated_at"])

    def reject(self):
        self.status = UserStatus.REJECTED
        self.is_active = False
        self.save(update_fields=["status", "is_active", "updated_at"])

    def suspend(self):
        self.status = UserStatus.SUSPENDED
        self.is_active = False
        self.save(update_fields=["status", "is_active", "updated_at"])

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.email

    def get_short_name(self):
        return self.first_name or self.email

    def __str__(self):
        return f"{self.first_name} {self.last_name} <{self.email}>"


class AuthProviderAccount(BaseModel):
    """Tracks OAuth provider connections per user (Google, Briq, etc.)."""
    PROVIDER_GOOGLE = "google"
    PROVIDER_BRIQ = "briq"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="auth_providers")
    provider = models.CharField(max_length=20)  # e.g. "google"
    provider_uid = models.CharField(max_length=255)
    provider_email = models.EmailField(blank=True)
    provider_data = models.JSONField(default=dict)

    class Meta:
        unique_together = [["user", "provider"]]

    def __str__(self):
        return f"{self.provider}:{self.provider_uid} → {self.user}"


class EducationLevel(models.TextChoices):
    SECONDARY_FORM1 = "secondary_form1", "Secondary – Form 1"
    SECONDARY_FORM2 = "secondary_form2", "Secondary – Form 2"
    SECONDARY_FORM3 = "secondary_form3", "Secondary – Form 3"
    SECONDARY_FORM4 = "secondary_form4", "Secondary – Form 4"
    SECONDARY_FORM5 = "secondary_form5", "Secondary – Form 5"
    SECONDARY_FORM6 = "secondary_form6", "Secondary – Form 6"
    UNI_CERTIFICATE = "uni_certificate", "University – Certificate"
    UNI_DIPLOMA = "uni_diploma", "University – Diploma"
    UNI_BACHELOR = "uni_bachelor", "University – Bachelor's Degree"
    UNI_MASTER = "uni_master", "University – Master's Degree"
    UNI_PHD = "uni_phd", "University – PhD"
    UNI_POSTDOC = "uni_postdoc", "University – Postdoctoral"
    OTHER = "other", "Other"


class Profile(BaseModel):
    """Base profile for all users."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    bio = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    phone_verified = models.BooleanField(default=False)
    institution = models.CharField(max_length=255, blank=True)
    education_level = models.CharField(
        max_length=50,
        choices=EducationLevel.choices,
        blank=True,
        default="",
    )
    region = models.CharField(max_length=100, blank=True)
    skills = models.TextField(blank=True, help_text="Comma-separated list of skills")
    research_interests = models.TextField(blank=True)
    achievements = models.TextField(blank=True)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.phone:
            qs = Profile.objects.filter(phone=self.phone).exclude(pk=self.pk)
            if qs.exists():
                raise ValidationError({"phone": "This phone number is already registered."})

    def __str__(self):
        return f"Profile of {self.user}"


class MentorProfile(BaseModel):
    """Extended profile for users with role=mentor."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="mentor_profile")
    expertise_areas = models.TextField(blank=True, help_text="Comma-separated expertise areas")
    availability = models.CharField(max_length=200, blank=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"MentorProfile of {self.user}"


class PartnerProfile(BaseModel):
    """Extended profile for users with role=industry_partner."""
    PARTNER_INDUSTRY = "industry"
    PARTNER_COMMUNITY = "community"
    PARTNER_TYPE_CHOICES = [
        (PARTNER_INDUSTRY, "Industry"),
        (PARTNER_COMMUNITY, "Community"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="partner_profile")
    org_name = models.CharField(max_length=255, blank=True)
    partner_type = models.CharField(max_length=20, choices=PARTNER_TYPE_CHOICES, default=PARTNER_INDUSTRY)
    sector = models.CharField(max_length=100, blank=True)
    contact_person = models.CharField(max_length=255, blank=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"PartnerProfile of {self.user}"


class ResearchAssistantProfile(BaseModel):
    """Extended profile for users with role=research_assistant."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="ra_profile")
    skills = models.TextField(blank=True, help_text="Comma-separated skills")
    availability = models.CharField(max_length=200, blank=True)
    portfolio = models.TextField(blank=True, help_text="Portfolio URL or description")

    def __str__(self):
        return f"RAProfile of {self.user}"

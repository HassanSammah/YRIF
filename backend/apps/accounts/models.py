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


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", UserRole.ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_approved", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    role = models.CharField(max_length=30, choices=UserRole.choices, default=UserRole.YOUTH)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = UserManager()

    def __str__(self):
        return f"{self.first_name} {self.last_name} <{self.email}>"


class Profile(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    bio = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    institution = models.CharField(max_length=255, blank=True)
    skills = models.TextField(blank=True, help_text="Comma-separated list of skills")
    research_interests = models.TextField(blank=True)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    region = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"Profile of {self.user}"

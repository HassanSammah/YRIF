from django.db import models
from django.conf import settings
from apps.core.models import BaseModel


class MentorProfile(BaseModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mentorship_mentor_profile",
    )
    expertise_areas = models.TextField(help_text="Comma-separated expertise areas")
    max_mentees = models.PositiveIntegerField(default=3)
    is_available = models.BooleanField(default=True)
    bio = models.TextField(blank=True)

    def __str__(self):
        return f"Mentor: {self.user}"


class MentorshipRequest(BaseModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        MATCHED = "matched", "Matched"
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        DECLINED = "declined", "Declined"

    mentee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mentorship_requests",
    )
    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mentorship_assignments",
    )
    research_area = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    def __str__(self):
        return f"{self.mentee} → {self.mentor or 'Unmatched'}"


class MentorFeedback(BaseModel):
    mentorship = models.ForeignKey(MentorshipRequest, on_delete=models.CASCADE, related_name="feedback")
    given_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField()
    comments = models.TextField(blank=True)

    def __str__(self):
        return f"Feedback on {self.mentorship}"

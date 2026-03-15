from django.db import models
from django.conf import settings
from apps.core.models import BaseModel


class MentorProfile(BaseModel):
    """Mentorship capacity data for mentors (legacy - kept for DB compat)."""
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
        APPROVED = "approved", "Approved"
        MATCHED = "matched", "Matched"
        DECLINED = "declined", "Declined"
        CLOSED = "closed", "Closed"

    mentee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mentorship_requests_as_mentee",
    )
    preferred_mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mentorship_requests_as_preferred",
    )
    topic = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )

    def __str__(self):
        return f"{self.mentee} → {self.preferred_mentor or 'Any Mentor'} ({self.topic})"


class MentorshipMatch(BaseModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    request = models.OneToOneField(
        MentorshipRequest,
        on_delete=models.SET_NULL,
        related_name="match",
        null=True,
        blank=True,
    )
    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mentorship_matches_as_mentor",
    )
    mentee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mentorship_matches_as_mentee",
    )
    matched_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="mentorship_matches_created",
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True,
    )
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.mentor} ↔ {self.mentee}"


class ResearchCollabRequest(BaseModel):
    """A request from a youth/researcher to partner with a research assistant."""
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        DECLINED = "declined", "Declined"
        CLOSED = "closed", "Closed"

    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="collab_requests_as_requester",
    )
    research_assistant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="collab_requests_as_ra",
    )
    topic = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )

    def __str__(self):
        return f"{self.requester} → {self.research_assistant or 'Any RA'} ({self.topic})"


class ResearchCollaboration(BaseModel):
    """An active research collaboration between a requester and a research assistant."""
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    request = models.OneToOneField(
        ResearchCollabRequest,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="collaboration",
    )
    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="collaborations_as_requester",
    )
    research_assistant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="collaborations_as_ra",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True,
    )
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.requester} ↔ {self.research_assistant}"


class MentorFeedback(BaseModel):
    match = models.ForeignKey(
        MentorshipMatch,
        on_delete=models.CASCADE,
        related_name="feedback",
        null=True,
        blank=True,
    )
    given_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    rating = models.PositiveSmallIntegerField(null=True, blank=True)
    feedback_text = models.TextField()

    def __str__(self):
        return f"Feedback by {self.given_by} on {self.match}"

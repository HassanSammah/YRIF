from django.db import models
from django.conf import settings
from apps.core.models import BaseModel


class ResearchCategory(models.TextChoices):
    NATURAL_SCIENCES = "natural_sciences", "Natural Sciences"
    SOCIAL_SCIENCES = "social_sciences", "Social Sciences"
    ARTS = "arts", "Arts & Humanities"
    TECHNOLOGY = "technology", "Technology & Engineering"


class ResearchStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    SUBMITTED = "submitted", "Submitted"
    UNDER_REVIEW = "under_review", "Under Review"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"
    PUBLISHED = "published", "Published"


class Research(BaseModel):
    title = models.CharField(max_length=300)
    abstract = models.TextField()
    category = models.CharField(max_length=30, choices=ResearchCategory.choices)
    status = models.CharField(max_length=20, choices=ResearchStatus.choices, default=ResearchStatus.DRAFT)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="research_submissions",
    )
    document = models.FileField(upload_to="research/documents/")
    dataset = models.FileField(upload_to="research/datasets/", null=True, blank=True)
    keywords = models.CharField(max_length=500, blank=True)
    views_count = models.PositiveIntegerField(default=0)
    downloads_count = models.PositiveIntegerField(default=0)
    rejection_reason = models.TextField(blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    open_for_collaboration = models.BooleanField(default=False, db_index=True)
    collaboration_description = models.TextField(
        blank=True,
        help_text="Describe what kind of RA collaboration you are looking for.",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "research"

    def __str__(self):
        return self.title


class ResearchReview(BaseModel):
    research = models.ForeignKey(Research, on_delete=models.CASCADE, related_name="reviews")
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="reviews_given",
    )
    comments = models.TextField()
    decision = models.CharField(
        max_length=20,
        choices=[("approve", "Approve"), ("reject", "Reject"), ("revise", "Request Revision")],
    )

    def __str__(self):
        return f"Review of '{self.research}' by {self.reviewer}"


class ReviewAssignment(BaseModel):
    class State(models.TextChoices):
        ASSIGNED = "assigned", "Assigned"
        COMPLETED = "completed", "Completed"

    research = models.ForeignKey(Research, on_delete=models.CASCADE, related_name="assignments")
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="review_assignments")
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="assignments_made")
    state = models.CharField(max_length=20, choices=State.choices, default=State.ASSIGNED)

    class Meta:
        unique_together = [["research", "reviewer"]]

    def __str__(self):
        return f"Assignment: {self.reviewer} → {self.research}"


class RAJoinRequestStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    ACCEPTED = "accepted", "Accepted"
    DECLINED = "declined", "Declined"


class RAJoinRequest(BaseModel):
    """An RA proactively requests to join an open research project."""
    research = models.ForeignKey(
        Research,
        on_delete=models.CASCADE,
        related_name="ra_join_requests",
    )
    ra = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ra_join_requests_sent",
    )
    message = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=RAJoinRequestStatus.choices,
        default=RAJoinRequestStatus.PENDING,
        db_index=True,
    )

    class Meta:
        unique_together = [["research", "ra"]]

    def __str__(self):
        return f"{self.ra} → {self.research} ({self.status})"

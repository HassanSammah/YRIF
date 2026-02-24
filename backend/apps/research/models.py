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
    published_at = models.DateTimeField(null=True, blank=True)

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

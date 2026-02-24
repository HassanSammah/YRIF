from django.db import models
from apps.core.models import BaseModel


class ResourceType(models.TextChoices):
    GUIDE = "guide", "Guide"
    TEMPLATE = "template", "Template"
    DATASET = "dataset", "Dataset"
    RECORDING = "recording", "Recorded Session"
    OTHER = "other", "Other"


class Resource(BaseModel):
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    resource_type = models.CharField(max_length=20, choices=ResourceType.choices)
    file = models.FileField(upload_to="resources/", null=True, blank=True)
    external_url = models.URLField(blank=True)
    is_published = models.BooleanField(default=True)
    downloads_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Webinar(BaseModel):
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    scheduled_at = models.DateTimeField()
    registration_link = models.URLField(blank=True)
    recording_url = models.URLField(blank=True)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["-scheduled_at"]

    def __str__(self):
        return self.title

from django.db import models
from django.conf import settings
from apps.core.models import BaseModel


class Announcement(BaseModel):
    title = models.CharField(max_length=300)
    content = models.TextField()
    is_published = models.BooleanField(default=False)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class NewsPost(BaseModel):
    title = models.CharField(max_length=300)
    slug = models.SlugField(unique=True)
    body = models.TextField()
    cover_image = models.ImageField(upload_to="news/", null=True, blank=True)
    is_published = models.BooleanField(default=False)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-published_at"]

    def __str__(self):
        return self.title

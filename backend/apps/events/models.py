from django.db import models
from django.conf import settings
from apps.core.models import BaseModel


class EventType(models.TextChoices):
    SEMINAR = "seminar", "Seminar"
    WORKSHOP = "workshop", "Workshop"
    BONANZA = "bonanza", "Bonanza"
    COMPETITION = "competition", "Competition"
    WEBINAR = "webinar", "Webinar"


class Event(BaseModel):
    title = models.CharField(max_length=300)
    description = models.TextField()
    event_type = models.CharField(
        max_length=20, choices=EventType.choices, default=EventType.SEMINAR, db_index=True
    )
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    registration_deadline = models.DateTimeField(null=True, blank=True)
    location = models.CharField(max_length=255, blank=True)
    is_online = models.BooleanField(default=False)
    online_link = models.URLField(blank=True)
    max_participants = models.PositiveIntegerField(null=True, blank=True)
    is_published = models.BooleanField(default=False, db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_events",
    )

    class Meta:
        ordering = ["start_date"]

    def __str__(self):
        return self.title

    @property
    def is_competition(self):
        return self.event_type == EventType.COMPETITION


class EventRegistration(BaseModel):
    class Status(models.TextChoices):
        REGISTERED = "registered", "Registered"
        ATTENDED = "attended", "Attended"
        CANCELLED = "cancelled", "Cancelled"

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="registrations")
    participant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="event_registrations",
    )
    research_submission = models.ForeignKey(
        "research.Research",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="competition_entries",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.REGISTERED,
        db_index=True,
    )

    class Meta:
        unique_together = ["event", "participant"]

    def __str__(self):
        return f"{self.participant} → {self.event}"


class JudgeScore(BaseModel):
    registration = models.ForeignKey(
        EventRegistration, on_delete=models.CASCADE, related_name="scores"
    )
    judge = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="scores_given",
    )
    score = models.DecimalField(max_digits=5, decimal_places=2)
    comments = models.TextField(blank=True)

    class Meta:
        unique_together = ["registration", "judge"]

    def __str__(self):
        return f"Score {self.score} by {self.judge} for {self.registration}"


class Winner(BaseModel):
    """Published competition winner."""
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="winners")
    registration = models.ForeignKey(
        EventRegistration, on_delete=models.CASCADE, related_name="winner_record"
    )
    rank = models.CharField(max_length=50, help_text="e.g. 1st Place, Best Presentation")
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ["event", "registration"]
        ordering = ["rank"]

    def __str__(self):
        return f"{self.rank} — {self.registration.participant} @ {self.event}"


class Certificate(BaseModel):
    class CertType(models.TextChoices):
        PARTICIPANT = "participant", "Participant"
        WINNER = "winner", "Winner"

    registration = models.OneToOneField(
        EventRegistration, on_delete=models.CASCADE, related_name="certificate"
    )
    certificate_type = models.CharField(
        max_length=20, choices=CertType.choices, default=CertType.PARTICIPANT
    )
    position = models.CharField(max_length=50, blank=True, help_text="e.g. 1st Place, Participant")
    file = models.FileField(upload_to="certificates/", null=True, blank=True)
    issued_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Certificate ({self.certificate_type}) for {self.registration}"

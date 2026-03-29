from django.db import models
from apps.core.models import BaseModel


class VacancyType(models.TextChoices):
    FULL_TIME = "full_time", "Full-time"
    PART_TIME = "part_time", "Part-time"
    CONTRACT = "contract", "Contract"
    INTERNSHIP = "internship", "Internship"


class Vacancy(BaseModel):
    title = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=VacancyType.choices)
    location = models.CharField(max_length=200)
    deadline = models.DateField()
    description = models.TextField()
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "vacancies"

    def __str__(self):
        return self.title


class DonationRecord(BaseModel):
    name = models.CharField(max_length=200)
    email = models.EmailField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    recurring = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} — {self.amount}"

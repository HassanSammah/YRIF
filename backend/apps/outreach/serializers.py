from rest_framework import serializers
from .models import Vacancy, DonationRecord


class VacancySerializer(serializers.ModelSerializer):
    class Meta:
        model = Vacancy
        fields = ["id", "title", "type", "location", "deadline", "description"]


class DonationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonationRecord
        fields = ["name", "email", "amount", "recurring"]

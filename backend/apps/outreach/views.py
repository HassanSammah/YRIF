import logging

from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from apps.accounts.models import User, PartnerProfile
from apps.research.models import Research, ResearchStatus
from apps.events.models import Event
from .models import Vacancy
from .serializers import VacancySerializer, DonationSerializer
from .emails import notify_donation_received

logger = logging.getLogger(__name__)


class PublicStatsView(APIView):
    """Public platform statistics for the landing page ImpactMetrics section."""
    permission_classes = [AllowAny]

    def get(self, request):
        from apps.accounts.models import UserStatus
        data = {
            "total_members": User.objects.filter(status=UserStatus.ACTIVE).count(),
            "research_projects": Research.objects.filter(status=ResearchStatus.PUBLISHED).count(),
            "events_hosted": Event.objects.filter(is_published=True).count(),
            "partner_organizations": PartnerProfile.objects.filter(
                user__status=UserStatus.ACTIVE
            ).count(),
        }
        return Response(data)


class VacancyListView(generics.ListAPIView):
    """Public list of active vacancies."""
    serializer_class = VacancySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Vacancy.objects.filter(is_active=True)


class DonationCreateView(generics.CreateAPIView):
    """Record a donation intent and send confirmation email."""
    serializer_class = DonationSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        record = serializer.save()
        try:
            notify_donation_received(
                name=record.name,
                email=record.email,
                amount=str(record.amount),
                recurring=record.recurring,
            )
        except Exception as exc:
            logger.error("Donation email notification failed: %s", exc)

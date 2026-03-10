from django.http import HttpResponse
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import ValidationError

from apps.core.permissions import IsAdmin, IsApproved
from apps.core.pagination import StandardPagination
from .models import Event, EventRegistration, JudgeScore, Winner, Certificate
from .serializers import (
    EventSerializer,
    EventRegistrationSerializer,
    JudgeScoreSerializer,
    WinnerSerializer,
    CertificateSerializer,
)
from .certificates import generate_certificate
from .emails import (
    notify_registration_confirmed,
    notify_registration_cancelled,
    notify_competition_results,
)


# ── Public: event listing & detail ────────────────────────────────────────────

class EventListView(generics.ListAPIView):
    """Public list of published events. Supports ?event_type= and search."""
    serializer_class = EventSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardPagination
    filterset_fields = ["event_type"]
    search_fields = ["title", "description"]

    def get_queryset(self):
        return Event.objects.filter(is_published=True).prefetch_related("registrations")


class EventDetailView(generics.RetrieveAPIView):
    """Public event detail (published only)."""
    serializer_class = EventSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Event.objects.filter(is_published=True).prefetch_related("registrations")


class EventWinnersView(generics.ListAPIView):
    """Public competition winners list."""
    serializer_class = WinnerSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Winner.objects.filter(
            event__pk=self.kwargs["pk"],
            event__is_published=True,
            published_at__isnull=False,
        ).select_related("registration__participant", "registration__research_submission")


# ── User: registration ────────────────────────────────────────────────────────

class EventRegisterView(generics.CreateAPIView):
    """ACTIVE user registers for a published event."""
    serializer_class = EventRegistrationSerializer
    permission_classes = [IsAuthenticated, IsApproved]

    def perform_create(self, serializer):
        event = generics.get_object_or_404(Event, pk=self.kwargs["pk"], is_published=True)

        # Capacity check
        if event.max_participants:
            active_count = event.registrations.exclude(status="cancelled").count()
            if active_count >= event.max_participants:
                raise ValidationError("This event has reached maximum capacity.")

        # Deadline check
        if event.registration_deadline and timezone.now() > event.registration_deadline:
            raise ValidationError("Registration deadline has passed.")

        # For competitions, research_submission is provided via request data
        research_submission = None
        if event.is_competition:
            sub_id = self.request.data.get("research_submission")
            if sub_id:
                from apps.research.models import Research
                research_submission = generics.get_object_or_404(
                    Research, pk=sub_id, author=self.request.user
                )

        reg = serializer.save(
            event=event,
            participant=self.request.user,
            research_submission=research_submission,
        )
        notify_registration_confirmed(reg)


class EventUnregisterView(APIView):
    """Cancel (unregister from) an event."""
    permission_classes = [IsAuthenticated, IsApproved]

    def delete(self, request, pk):
        registration = generics.get_object_or_404(
            EventRegistration,
            event__pk=pk,
            participant=request.user,
        )
        if registration.status == EventRegistration.Status.CANCELLED:
            return Response({"detail": "Already cancelled."}, status=status.HTTP_400_BAD_REQUEST)
        registration.status = EventRegistration.Status.CANCELLED
        registration.save(update_fields=["status", "updated_at"])
        notify_registration_cancelled(registration)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyRegistrationsView(generics.ListAPIView):
    """List the current user's event registrations."""
    serializer_class = EventRegistrationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        return (
            EventRegistration.objects
            .filter(participant=self.request.user)
            .select_related("event", "participant", "research_submission")
            .prefetch_related("scores")
        )


# ── Certificates ──────────────────────────────────────────────────────────────

class MyCertificatesView(generics.ListAPIView):
    """List all certificates for the current user."""
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Certificate.objects.filter(
            registration__participant=self.request.user,
        ).select_related("registration__event")


class CertificateDownloadView(APIView):
    """Generate and download a PDF certificate for a given registration."""
    permission_classes = [IsAuthenticated]

    def get(self, request, reg_pk):
        registration = generics.get_object_or_404(
            EventRegistration,
            pk=reg_pk,
            participant=request.user,
            status__in=[
                EventRegistration.Status.REGISTERED,
                EventRegistration.Status.ATTENDED,
            ],
        )
        cert, _ = Certificate.objects.get_or_create(
            registration=registration,
            defaults={"certificate_type": Certificate.CertType.PARTICIPANT},
        )

        # Upgrade to winner type if there is a winner record
        winner = Winner.objects.filter(registration=registration, published_at__isnull=False).first()
        if winner:
            cert.certificate_type = Certificate.CertType.WINNER
            cert.position = winner.rank
            cert.save(update_fields=["certificate_type", "position"])

        pdf_bytes = generate_certificate(
            participant_name=registration.participant.get_full_name(),
            event_name=registration.event.title,
            event_date=registration.event.start_date.strftime("%B %d, %Y"),
            position=cert.position,
        )
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = (
            f'attachment; filename="certificate_{reg_pk}.pdf"'
        )
        return response


# ── Judge: scoring ────────────────────────────────────────────────────────────

class JudgeScoreView(generics.CreateAPIView):
    """Judge (or admin) scores a competition registration."""
    serializer_class = JudgeScoreSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        user = self.request.user
        if user.is_authenticated and user.role in ("admin", "staff", "program_manager", "judge"):
            return [IsAuthenticated()]
        return [IsAdmin()]

    def perform_create(self, serializer):
        registration = generics.get_object_or_404(
            EventRegistration,
            pk=self.kwargs["reg_pk"],
            event__event_type="competition",
        )
        serializer.save(judge=self.request.user, registration=registration)


# ── Admin: event management ────────────────────────────────────────────────────

class AdminEventListView(generics.ListAPIView):
    """Admin: all events (published + draft)."""
    serializer_class = EventSerializer
    permission_classes = [IsAdmin]
    pagination_class = StandardPagination
    filterset_fields = ["event_type", "is_published"]
    search_fields = ["title", "description"]

    def get_queryset(self):
        return Event.objects.prefetch_related("registrations")


class EventCreateView(generics.CreateAPIView):
    """Admin creates an event."""
    serializer_class = EventSerializer
    permission_classes = [IsAdmin]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class EventAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin retrieves, updates, or deletes any event."""
    serializer_class = EventSerializer
    permission_classes = [IsAdmin]
    queryset = Event.objects.all()


class EventPublishView(APIView):
    """Admin publishes (or unpublishes) an event."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        event = generics.get_object_or_404(Event, pk=pk)
        publish = request.data.get("publish", True)
        event.is_published = bool(publish)
        event.save(update_fields=["is_published", "updated_at"])
        return Response(EventSerializer(event).data)


class AdminEventRegistrationsView(generics.ListAPIView):
    """Admin lists all registrations for a given event."""
    serializer_class = EventRegistrationSerializer
    permission_classes = [IsAdmin]
    pagination_class = StandardPagination

    def get_queryset(self):
        return (
            EventRegistration.objects
            .filter(event__pk=self.kwargs["pk"])
            .select_related("event", "participant", "research_submission")
            .prefetch_related("scores")
        )


class AdminUpdateRegistrationStatusView(APIView):
    """Admin marks a registration as attended or reverts to registered."""
    permission_classes = [IsAdmin]

    def patch(self, request, reg_pk):
        registration = generics.get_object_or_404(EventRegistration, pk=reg_pk)
        new_status = request.data.get("status")
        valid = [s.value for s in EventRegistration.Status]
        if new_status not in valid:
            return Response(
                {"detail": f"status must be one of: {', '.join(valid)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        registration.status = new_status
        registration.save(update_fields=["status", "updated_at"])
        return Response(EventRegistrationSerializer(registration).data)


class AdminPublishWinnersView(APIView):
    """
    Admin publishes competition winners.
    POST body: { "winners": [{ "registration_id": "...", "rank": "1st Place" }, ...] }
    Triggers certificate generation and email notifications.
    """
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        event = generics.get_object_or_404(Event, pk=pk, event_type="competition")
        winners_data = request.data.get("winners", [])
        if not winners_data:
            return Response(
                {"detail": "winners list is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        created_winners = []

        for entry in winners_data:
            reg_id = entry.get("registration_id")
            rank = entry.get("rank", "")
            if not reg_id:
                continue
            registration = generics.get_object_or_404(
                EventRegistration, pk=reg_id, event=event
            )
            winner, _ = Winner.objects.update_or_create(
                event=event,
                registration=registration,
                defaults={"rank": rank, "published_at": now},
            )
            # Update certificate type and position
            cert, _ = Certificate.objects.get_or_create(
                registration=registration,
                defaults={"certificate_type": Certificate.CertType.WINNER, "position": rank},
            )
            cert.certificate_type = Certificate.CertType.WINNER
            cert.position = rank
            cert.save(update_fields=["certificate_type", "position"])

            created_winners.append(winner)

        # Notify all participants
        notify_competition_results(event, created_winners)

        return Response(WinnerSerializer(created_winners, many=True).data, status=status.HTTP_201_CREATED)

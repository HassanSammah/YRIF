from django.http import HttpResponse
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from apps.core.permissions import IsAdmin, IsApproved
from .models import Event, EventRegistration, Certificate
from .serializers import EventSerializer, EventRegistrationSerializer, JudgeScoreSerializer
from .certificates import generate_certificate


class EventListView(generics.ListAPIView):
    serializer_class = EventSerializer
    permission_classes = [AllowAny]
    queryset = Event.objects.filter(is_published=True)
    filterset_fields = ["event_type"]
    search_fields = ["title", "description"]


class EventDetailView(generics.RetrieveAPIView):
    serializer_class = EventSerializer
    permission_classes = [AllowAny]
    queryset = Event.objects.filter(is_published=True)


class EventRegisterView(generics.CreateAPIView):
    serializer_class = EventRegistrationSerializer
    permission_classes = [IsAuthenticated, IsApproved]

    def perform_create(self, serializer):
        event = generics.get_object_or_404(Event, pk=self.kwargs["pk"], is_published=True)
        serializer.save(event=event, participant=self.request.user)


class JudgeScoreView(generics.CreateAPIView):
    serializer_class = JudgeScoreSerializer
    permission_classes = [IsAdmin]

    def perform_create(self, serializer):
        registration = generics.get_object_or_404(EventRegistration, pk=self.kwargs["pk"])
        serializer.save(judge=self.request.user, registration=registration)


class CertificateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        registration = generics.get_object_or_404(
            EventRegistration, pk=pk, participant=request.user
        )
        cert, _ = Certificate.objects.get_or_create(registration=registration)
        pdf_bytes = generate_certificate(
            participant_name=registration.participant.get_full_name(),
            event_name=registration.event.title,
            event_date=registration.event.start_date.strftime("%B %d, %Y"),
            position=cert.position,
        )
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="certificate_{pk}.pdf"'
        return response


class EventCreateView(generics.CreateAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAdmin]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class EventAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAdmin]
    queryset = Event.objects.all()

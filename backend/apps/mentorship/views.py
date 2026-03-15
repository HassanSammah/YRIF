from django.db import models as django_models
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import generics, filters, status, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.core.permissions import IsAdmin, IsApproved
from apps.accounts.models import UserRole, UserStatus
from .models import MentorshipRequest, MentorshipMatch, MentorFeedback, ResearchCollabRequest, ResearchCollaboration
from .serializers import (
    MentorDirectorySerializer,
    PartnerDirectorySerializer,
    MentorshipRequestSerializer,
    MentorshipMatchSerializer,
    MentorFeedbackSerializer,
    RADirectorySerializer,
    ResearchCollabRequestSerializer,
    ResearchCollaborationSerializer,
)
from .emails import (
    notify_mentorship_matched,
    notify_mentorship_request_declined,
    notify_match_completed,
)

User = get_user_model()


# ── Mentor & Partner Directory ────────────────────────────────────────────────

class MentorListView(generics.ListAPIView):
    """Public mentor directory – all active, approved mentors."""
    serializer_class = MentorDirectorySerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ["first_name", "last_name", "mentor_profile__expertise_areas"]

    def get_queryset(self):
        return (
            User.objects
            .filter(role=UserRole.MENTOR, status=UserStatus.ACTIVE)
            .select_related("mentor_profile", "profile")
            .order_by("first_name")
        )


class MentorDetailView(generics.RetrieveAPIView):
    """Public single mentor profile."""
    serializer_class = MentorDirectorySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return (
            User.objects
            .filter(role=UserRole.MENTOR, status=UserStatus.ACTIVE)
            .select_related("mentor_profile", "profile")
        )


class PartnerNetworkView(generics.ListAPIView):
    """Public partner network directory – verified industry/community partners."""
    serializer_class = PartnerDirectorySerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["first_name", "last_name", "partner_profile__org_name", "partner_profile__sector"]
    filterset_fields = ["partner_profile__partner_type"]

    def get_queryset(self):
        return (
            User.objects
            .filter(role=UserRole.INDUSTRY_PARTNER, status=UserStatus.ACTIVE)
            .select_related("partner_profile", "profile")
            .order_by("partner_profile__org_name")
        )


# ── Mentorship Requests ───────────────────────────────────────────────────────

class MentorshipRequestListCreateView(generics.ListCreateAPIView):
    """
    GET: List own requests.
      - Mentees see their submitted requests.
      - Mentors see requests that preferred them.
      - Admins see all.
    POST: Create a new mentorship request (any approved user except mentors/admins).
    """
    serializer_class = MentorshipRequestSerializer
    permission_classes = [IsAuthenticated, IsApproved]

    def get_queryset(self):
        user = self.request.user
        qs = MentorshipRequest.objects.select_related(
            "mentee", "mentee__profile", "preferred_mentor"
        )
        if user.role in (UserRole.ADMIN, UserRole.STAFF, UserRole.PROGRAM_MANAGER):
            return qs.order_by("-created_at")
        if user.role == UserRole.MENTOR:
            return qs.filter(
                django_models.Q(preferred_mentor=user) |
                django_models.Q(
                    preferred_mentor__isnull=True,
                    status__in=[MentorshipRequest.Status.PENDING, MentorshipRequest.Status.APPROVED],
                )
            ).order_by("-created_at")
        return qs.filter(mentee=user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(mentee=self.request.user)


class MentorshipRequestDetailView(generics.RetrieveUpdateAPIView):
    """Admin: view & update a request status (approve / decline)."""
    serializer_class = MentorshipRequestSerializer
    permission_classes = [IsAdmin]
    queryset = MentorshipRequest.objects.select_related("mentee", "preferred_mentor")

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        new_status = request.data.get("status")
        allowed = {MentorshipRequest.Status.APPROVED, MentorshipRequest.Status.DECLINED}
        if new_status not in allowed:
            return Response(
                {"detail": f"Use one of: {', '.join(allowed)}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if instance.status in (MentorshipRequest.Status.MATCHED, MentorshipRequest.Status.CLOSED):
            return Response(
                {"detail": "Cannot update a matched or closed request."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        instance.status = new_status
        instance.save(update_fields=["status", "updated_at"])
        if new_status == MentorshipRequest.Status.DECLINED:
            notify_mentorship_request_declined(instance.mentee, instance.topic)
        return Response(MentorshipRequestSerializer(instance).data)


# ── Mentorship Matches ────────────────────────────────────────────────────────

class MatchCreateView(APIView):
    """Admin: create a match for an approved (or pending) request."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        mentorship_request = get_object_or_404(MentorshipRequest, pk=pk)

        if mentorship_request.status in (
            MentorshipRequest.Status.MATCHED,
            MentorshipRequest.Status.CLOSED,
            MentorshipRequest.Status.DECLINED,
        ):
            return Response(
                {"detail": "Request is not in a matchable state."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        mentor_id = request.data.get("mentor_id")
        if not mentor_id:
            return Response({"detail": "mentor_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        mentor = get_object_or_404(
            User, pk=mentor_id, role=UserRole.MENTOR, status=UserStatus.ACTIVE
        )

        match = MentorshipMatch.objects.create(
            request=mentorship_request,
            mentor=mentor,
            mentee=mentorship_request.mentee,
            matched_by=request.user,
        )
        mentorship_request.status = MentorshipRequest.Status.MATCHED
        mentorship_request.save(update_fields=["status", "updated_at"])
        notify_mentorship_matched(mentor, mentorship_request.mentee, mentorship_request.topic)
        return Response(MentorshipMatchSerializer(match).data, status=status.HTTP_201_CREATED)


class MentorshipMatchListView(generics.ListAPIView):
    """List matches for the current user (mentor/mentee) or all for admin."""
    serializer_class = MentorshipMatchSerializer
    permission_classes = [IsAuthenticated, IsApproved]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status"]

    def get_queryset(self):
        user = self.request.user
        qs = MentorshipMatch.objects.select_related(
            "mentor", "mentee", "matched_by", "request"
        ).order_by("-created_at")
        if user.role in (UserRole.ADMIN, UserRole.STAFF, UserRole.PROGRAM_MANAGER):
            return qs
        if user.role == UserRole.MENTOR:
            return qs.filter(mentor=user)
        return qs.filter(mentee=user)


class MentorshipMatchDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve or update a match (participants or admin)."""
    serializer_class = MentorshipMatchSerializer
    permission_classes = [IsAuthenticated, IsApproved]

    def get_queryset(self):
        user = self.request.user
        qs = MentorshipMatch.objects.select_related("mentor", "mentee", "matched_by", "request")
        if user.role in (UserRole.ADMIN, UserRole.STAFF, UserRole.PROGRAM_MANAGER):
            return qs
        return qs.filter(
            django_models.Q(mentor=user) | django_models.Q(mentee=user)
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        new_status = request.data.get("status")
        notes = request.data.get("notes", instance.notes)

        if new_status and new_status not in MentorshipMatch.Status.values:
            return Response({"detail": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)

        if new_status:
            instance.status = new_status
        instance.notes = notes
        instance.save(update_fields=["status", "notes", "updated_at"])

        if new_status == MentorshipMatch.Status.COMPLETED:
            # Close the originating request
            if instance.request:
                instance.request.status = MentorshipRequest.Status.CLOSED
                instance.request.save(update_fields=["status", "updated_at"])
            notify_match_completed(instance.mentor, instance.mentee, self._get_topic(instance))

        return Response(MentorshipMatchSerializer(instance).data)

    def _get_topic(self, match):
        return match.request.topic if match.request else "N/A"


# ── Mentor Accept / Decline ───────────────────────────────────────────────────

class MentorAcceptView(APIView):
    """Mentor accepts a mentorship request directed to them, auto-creating a match."""
    permission_classes = [IsAuthenticated, IsApproved]

    def post(self, request, pk):
        user = request.user
        if user.role != UserRole.MENTOR:
            return Response(
                {"detail": "Only mentors can accept requests."},
                status=status.HTTP_403_FORBIDDEN,
            )

        mr = get_object_or_404(
            MentorshipRequest.objects.select_related("mentee", "mentee__profile"),
            pk=pk,
        )

        if mr.preferred_mentor and mr.preferred_mentor != user:
            return Response(
                {"detail": "This request is directed to a different mentor."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if mr.status not in (MentorshipRequest.Status.PENDING, MentorshipRequest.Status.APPROVED):
            return Response(
                {"detail": "Request is not in a state that can be accepted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        match = MentorshipMatch.objects.create(
            request=mr,
            mentor=user,
            mentee=mr.mentee,
            matched_by=user,
        )
        mr.status = MentorshipRequest.Status.MATCHED
        mr.save(update_fields=["status", "updated_at"])
        notify_mentorship_matched(user, mr.mentee, mr.topic)
        return Response(MentorshipMatchSerializer(match).data, status=status.HTTP_201_CREATED)


class MentorDeclineView(APIView):
    """Mentor declines a mentorship request directed to them."""
    permission_classes = [IsAuthenticated, IsApproved]

    def post(self, request, pk):
        user = request.user
        if user.role != UserRole.MENTOR:
            return Response(
                {"detail": "Only mentors can decline requests."},
                status=status.HTTP_403_FORBIDDEN,
            )

        mr = get_object_or_404(MentorshipRequest, pk=pk)

        if mr.preferred_mentor and mr.preferred_mentor != user:
            return Response(
                {"detail": "This request is directed to a different mentor."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if mr.status not in (MentorshipRequest.Status.PENDING, MentorshipRequest.Status.APPROVED):
            return Response(
                {"detail": "Request cannot be declined in its current state."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        mr.status = MentorshipRequest.Status.DECLINED
        mr.save(update_fields=["status", "updated_at"])
        notify_mentorship_request_declined(mr.mentee, mr.topic)
        return Response({"detail": "Request declined."})


# ── Feedback ──────────────────────────────────────────────────────────────────

class MatchFeedbackCreateView(generics.CreateAPIView):
    """Submit feedback for a mentorship match."""
    serializer_class = MentorFeedbackSerializer
    permission_classes = [IsAuthenticated, IsApproved]

    def perform_create(self, serializer):
        match = get_object_or_404(MentorshipMatch, pk=self.kwargs["pk"])
        serializer.save(given_by=self.request.user, match=match)


class MatchFeedbackListView(generics.ListAPIView):
    """List feedback for a specific match."""
    serializer_class = MentorFeedbackSerializer
    permission_classes = [IsAuthenticated, IsApproved]

    def get_queryset(self):
        match = get_object_or_404(MentorshipMatch, pk=self.kwargs["pk"])
        return MentorFeedback.objects.filter(match=match).select_related("given_by")


# ── Research Assistant Directory ──────────────────────────────────────────────

class RAListView(generics.ListAPIView):
    """Public research assistant directory – all active, approved RAs."""
    serializer_class = RADirectorySerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ["first_name", "last_name", "ra_profile__skills"]

    def get_queryset(self):
        from apps.accounts.models import UserRole as AR, UserStatus as AS
        return (
            User.objects
            .filter(role=AR.RESEARCH_ASSISTANT, status=AS.ACTIVE)
            .select_related("ra_profile", "profile")
            .order_by("first_name")
        )


class RADetailView(generics.RetrieveAPIView):
    """Public single research assistant profile."""
    serializer_class = RADirectorySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from apps.accounts.models import UserRole as AR, UserStatus as AS
        return (
            User.objects
            .filter(role=AR.RESEARCH_ASSISTANT, status=AS.ACTIVE)
            .select_related("ra_profile", "profile")
        )


# ── Research Collaboration Requests ──────────────────────────────────────────

class CollabRequestListCreateView(generics.ListCreateAPIView):
    """
    GET: List collab requests.
      - Requesters see their own.
      - RAs see requests directed to them.
      - Admins see all.
    POST: Create a collab request (any approved user except RAs and admins).
    """
    serializer_class = ResearchCollabRequestSerializer
    permission_classes = [IsAuthenticated, IsApproved]

    def get_queryset(self):
        user = self.request.user
        qs = ResearchCollabRequest.objects.select_related(
            "requester", "requester__profile", "research_assistant"
        )
        if user.role in (UserRole.ADMIN, UserRole.STAFF, UserRole.PROGRAM_MANAGER):
            return qs.order_by("-created_at")
        if user.role == UserRole.RESEARCH_ASSISTANT:
            return qs.filter(research_assistant=user).order_by("-created_at")
        return qs.filter(requester=user).order_by("-created_at")

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == UserRole.RESEARCH_ASSISTANT:
            raise serializers.ValidationError("Research assistants cannot create collaboration requests.")
        serializer.save(requester=user)


class RAAcceptCollabView(APIView):
    """RA accepts a collaboration request, auto-creating an active collaboration."""
    permission_classes = [IsAuthenticated, IsApproved]

    def post(self, request, pk):
        user = request.user
        if user.role != UserRole.RESEARCH_ASSISTANT:
            return Response(
                {"detail": "Only research assistants can accept collaboration requests."},
                status=status.HTTP_403_FORBIDDEN,
            )

        cr = get_object_or_404(
            ResearchCollabRequest.objects.select_related("requester", "requester__profile"),
            pk=pk,
        )

        if cr.research_assistant and cr.research_assistant != user:
            return Response(
                {"detail": "This request is directed to a different research assistant."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if cr.status not in (ResearchCollabRequest.Status.PENDING,):
            return Response(
                {"detail": "Request cannot be accepted in its current state."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        collab = ResearchCollaboration.objects.create(
            request=cr,
            requester=cr.requester,
            research_assistant=user,
        )
        cr.status = ResearchCollabRequest.Status.ACCEPTED
        cr.research_assistant = user
        cr.save(update_fields=["status", "research_assistant", "updated_at"])
        return Response(ResearchCollaborationSerializer(collab).data, status=status.HTTP_201_CREATED)


class RADeclineCollabView(APIView):
    """RA declines a collaboration request."""
    permission_classes = [IsAuthenticated, IsApproved]

    def post(self, request, pk):
        user = request.user
        if user.role != UserRole.RESEARCH_ASSISTANT:
            return Response(
                {"detail": "Only research assistants can decline collaboration requests."},
                status=status.HTTP_403_FORBIDDEN,
            )

        cr = get_object_or_404(ResearchCollabRequest, pk=pk)

        if cr.research_assistant and cr.research_assistant != user:
            return Response(
                {"detail": "This request is directed to a different research assistant."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if cr.status != ResearchCollabRequest.Status.PENDING:
            return Response(
                {"detail": "Request cannot be declined in its current state."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cr.status = ResearchCollabRequest.Status.DECLINED
        cr.save(update_fields=["status", "updated_at"])
        return Response({"detail": "Request declined."})


# ── Research Collaborations ───────────────────────────────────────────────────

class CollaborationListView(generics.ListAPIView):
    """List collaborations for the current user or all for admin."""
    serializer_class = ResearchCollaborationSerializer
    permission_classes = [IsAuthenticated, IsApproved]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status"]

    def get_queryset(self):
        user = self.request.user
        qs = ResearchCollaboration.objects.select_related(
            "requester", "research_assistant", "request"
        ).order_by("-created_at")
        if user.role in (UserRole.ADMIN, UserRole.STAFF, UserRole.PROGRAM_MANAGER):
            return qs
        if user.role == UserRole.RESEARCH_ASSISTANT:
            return qs.filter(research_assistant=user)
        return qs.filter(requester=user)


class CollaborationDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve or update a collaboration (participants or admin)."""
    serializer_class = ResearchCollaborationSerializer
    permission_classes = [IsAuthenticated, IsApproved]

    def get_queryset(self):
        user = self.request.user
        qs = ResearchCollaboration.objects.select_related("requester", "research_assistant", "request")
        if user.role in (UserRole.ADMIN, UserRole.STAFF, UserRole.PROGRAM_MANAGER):
            return qs
        return qs.filter(
            django_models.Q(requester=user) | django_models.Q(research_assistant=user)
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        new_status = request.data.get("status")
        notes = request.data.get("notes", instance.notes)

        if new_status and new_status not in ResearchCollaboration.Status.values:
            return Response({"detail": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)

        if new_status:
            instance.status = new_status
        instance.notes = notes
        instance.save(update_fields=["status", "notes", "updated_at"])

        if new_status == ResearchCollaboration.Status.COMPLETED and instance.request:
            instance.request.status = ResearchCollabRequest.Status.CLOSED
            instance.request.save(update_fields=["status", "updated_at"])

        return Response(ResearchCollaborationSerializer(instance).data)

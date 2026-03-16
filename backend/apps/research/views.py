from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import PermissionDenied

from apps.core.permissions import IsAdmin, IsApproved
from apps.core.pagination import StandardPagination
from .models import Research, ResearchStatus, ReviewAssignment, RAJoinRequest, RAJoinRequestStatus
from .serializers import (
    ResearchSerializer,
    ResearchAdminSerializer,
    ResearchReviewSerializer,
    ReviewAssignmentSerializer,
    OpenResearchSerializer,
    RAJoinRequestSerializer,
)
from .emails import notify_research_submitted, notify_research_status_changed


# ── Public: research repository ───────────────────────────────────────────────

class ResearchListView(generics.ListAPIView):
    """Public repository — only PUBLISHED research is visible."""
    serializer_class = ResearchSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardPagination
    filterset_fields = ["category"]
    search_fields = ["title", "abstract", "keywords"]

    def get_queryset(self):
        return Research.objects.filter(
            status=ResearchStatus.PUBLISHED
        ).select_related("author")


# ── Author: create draft ───────────────────────────────────────────────────────

class ResearchCreateView(generics.CreateAPIView):
    """ACTIVE users can create a new research draft."""
    serializer_class = ResearchSerializer
    permission_classes = [IsAuthenticated, IsApproved]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user, status=ResearchStatus.DRAFT)


# ── Author: update own draft ───────────────────────────────────────────────────

class ResearchUpdateView(generics.RetrieveUpdateAPIView):
    """Author can view and update their own draft."""
    serializer_class = ResearchSerializer
    permission_classes = [IsAuthenticated, IsApproved]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Research.objects.filter(
            author=self.request.user,
            status=ResearchStatus.DRAFT,
        )


# ── Author: submit draft ───────────────────────────────────────────────────────

class ResearchSubmitView(APIView):
    """Submit a draft for review (transitions DRAFT → SUBMITTED)."""
    permission_classes = [IsAuthenticated, IsApproved]

    def post(self, request, pk):
        research = generics.get_object_or_404(
            Research, pk=pk, author=request.user, status=ResearchStatus.DRAFT
        )
        research.status = ResearchStatus.SUBMITTED
        research.save(update_fields=["status", "updated_at"])
        notify_research_submitted(research)
        return Response(ResearchSerializer(research, context={"request": request}).data)


# ── Author: my research ────────────────────────────────────────────────────────

class MyResearchView(generics.ListAPIView):
    """List all research belonging to the current user."""
    serializer_class = ResearchSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        return Research.objects.filter(
            author=self.request.user
        ).select_related("author")


# ── Public: research detail ────────────────────────────────────────────────────

class ResearchDetailView(generics.RetrieveAPIView):
    """
    Detail view.
    - PUBLISHED → public, increments views_count.
    - Non-PUBLISHED → only author, admin, or assigned reviewer.
    """
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        user = self.request.user
        if user.is_authenticated and user.role in ("admin", "staff", "program_manager"):
            return ResearchAdminSerializer
        return ResearchSerializer

    def get_queryset(self):
        return Research.objects.select_related("author", "author__profile").prefetch_related(
            "reviews__reviewer", "assignments__reviewer", "ra_join_requests__ra"
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()

        # Visibility gate for non-published research
        if instance.status != ResearchStatus.PUBLISHED:
            if not request.user.is_authenticated:
                return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
            user = request.user
            is_admin = user.role in ("admin", "staff", "program_manager")
            is_author = str(instance.author_id) == str(user.id)
            is_reviewer = instance.assignments.filter(reviewer=user).exists()
            if not (is_admin or is_author or is_reviewer):
                return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        # Increment views only for published research
        if instance.status == ResearchStatus.PUBLISHED:
            Research.objects.filter(pk=instance.pk).update(
                views_count=instance.views_count + 1
            )

        serializer = self.get_serializer(instance)
        return Response(serializer.data)


# ── Public: download ───────────────────────────────────────────────────────────

class ResearchDownloadView(APIView):
    """Return document URL and increment download counter (PUBLISHED only)."""
    permission_classes = [AllowAny]

    def get(self, request, pk):
        research = generics.get_object_or_404(
            Research, pk=pk, status=ResearchStatus.PUBLISHED
        )
        Research.objects.filter(pk=pk).update(
            downloads_count=research.downloads_count + 1
        )
        return Response({"document_url": request.build_absolute_uri(research.document.url)})


# ── Admin: list all research ───────────────────────────────────────────────────

class AdminResearchListView(generics.ListAPIView):
    """Admin view of all submissions with search and filter."""
    serializer_class = ResearchAdminSerializer
    permission_classes = [IsAdmin]
    pagination_class = StandardPagination
    filterset_fields = ["category", "status"]
    search_fields = ["title", "author__first_name", "author__last_name", "author__email"]

    def get_queryset(self):
        return Research.objects.select_related("author").prefetch_related(
            "reviews__reviewer", "assignments__reviewer"
        )


# ── Admin: assign reviewer ─────────────────────────────────────────────────────

class ResearchAssignReviewerView(APIView):
    """Admin assigns a reviewer to a submission (SUBMITTED or UNDER_REVIEW)."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        research = generics.get_object_or_404(Research, pk=pk)
        if research.status not in (ResearchStatus.SUBMITTED, ResearchStatus.UNDER_REVIEW):
            return Response(
                {"detail": "Research must be SUBMITTED or UNDER_REVIEW to assign a reviewer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reviewer_id = request.data.get("reviewer_id")
        if not reviewer_id:
            return Response({"detail": "reviewer_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        from apps.accounts.models import User
        try:
            reviewer = User.objects.get(pk=reviewer_id)
        except User.DoesNotExist:
            return Response({"detail": "Reviewer not found."}, status=status.HTTP_404_NOT_FOUND)

        assignment, created = ReviewAssignment.objects.get_or_create(
            research=research,
            reviewer=reviewer,
            defaults={"assigned_by": request.user},
        )

        # Transition to UNDER_REVIEW on first assignment
        if research.status == ResearchStatus.SUBMITTED:
            research.status = ResearchStatus.UNDER_REVIEW
            research.save(update_fields=["status", "updated_at"])
            notify_research_status_changed(research)

        return Response(
            ReviewAssignmentSerializer(assignment).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


# ── Reviewer: add comment ──────────────────────────────────────────────────────

class ResearchCommentView(generics.CreateAPIView):
    """Assigned reviewer (or admin) adds a comment and recommendation."""
    serializer_class = ResearchReviewSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        research = generics.get_object_or_404(Research, pk=self.kwargs["pk"])
        user = self.request.user
        is_admin = user.role in ("admin", "staff", "program_manager")
        is_reviewer = research.assignments.filter(reviewer=user).exists()

        if not (is_admin or is_reviewer):
            raise PermissionDenied("You are not assigned to review this submission.")

        serializer.save(reviewer=user, research=research)

        # Mark the reviewer's assignment as completed
        ReviewAssignment.objects.filter(research=research, reviewer=user).update(
            state=ReviewAssignment.State.COMPLETED
        )


# ── Admin: approve or reject ───────────────────────────────────────────────────

class ResearchDecideView(APIView):
    """Admin approves or rejects a submission (SUBMITTED or UNDER_REVIEW)."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        research = generics.get_object_or_404(Research, pk=pk)
        if research.status not in (ResearchStatus.SUBMITTED, ResearchStatus.UNDER_REVIEW):
            return Response(
                {"detail": "Research must be SUBMITTED or UNDER_REVIEW to decide."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        decision = request.data.get("decision")
        if decision not in ("approve", "reject"):
            return Response(
                {"detail": "decision must be 'approve' or 'reject'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if decision == "approve":
            research.status = ResearchStatus.APPROVED
            research.rejection_reason = ""
        else:
            research.status = ResearchStatus.REJECTED
            research.rejection_reason = request.data.get("reason", "")

        research.save(update_fields=["status", "rejection_reason", "updated_at"])
        notify_research_status_changed(research)
        return Response(ResearchAdminSerializer(research, context={"request": request}).data)


# ── Admin: publish ─────────────────────────────────────────────────────────────

class ResearchPublishView(APIView):
    """Admin publishes an approved submission (APPROVED → PUBLISHED)."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        research = generics.get_object_or_404(
            Research, pk=pk, status=ResearchStatus.APPROVED
        )
        research.status = ResearchStatus.PUBLISHED
        research.published_at = timezone.now()
        research.save(update_fields=["status", "published_at", "updated_at"])
        notify_research_status_changed(research)
        return Response(ResearchAdminSerializer(research, context={"request": request}).data)


# ── RA: Open research projects ─────────────────────────────────────────────────

class OpenResearchListView(generics.ListAPIView):
    """Authenticated users can browse research projects open for RA collaboration."""
    serializer_class = OpenResearchSerializer
    permission_classes = [IsAuthenticated, IsApproved]
    pagination_class = StandardPagination
    filterset_fields = ["category"]
    search_fields = ["title", "abstract", "keywords"]

    def get_queryset(self):
        return Research.objects.filter(
            open_for_collaboration=True,
            status__in=[
                ResearchStatus.SUBMITTED,
                ResearchStatus.UNDER_REVIEW,
                ResearchStatus.APPROVED,
                ResearchStatus.PUBLISHED,
            ],
        ).select_related("author", "author__profile").prefetch_related("ra_join_requests")


class RAJoinRequestCreateView(APIView):
    """RA submits a request to join an open research project."""
    permission_classes = [IsAuthenticated, IsApproved]

    def post(self, request, pk):
        from apps.accounts.models import UserRole
        if request.user.role != UserRole.RESEARCH_ASSISTANT:
            return Response(
                {"detail": "Only research assistants can send join requests."},
                status=status.HTTP_403_FORBIDDEN,
            )
        research = generics.get_object_or_404(
            Research, pk=pk, open_for_collaboration=True
        )
        if research.author_id == request.user.id:
            return Response(
                {"detail": "You cannot join your own research."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        existing = RAJoinRequest.objects.filter(research=research, ra=request.user).first()
        if existing:
            return Response(
                {"detail": f"You already have a {existing.status} request for this project."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        join_req = RAJoinRequest.objects.create(
            research=research,
            ra=request.user,
            message=request.data.get("message", ""),
        )
        return Response(
            RAJoinRequestSerializer(join_req).data,
            status=status.HTTP_201_CREATED,
        )


class RAJoinRequestDecideView(APIView):
    """Research author accepts or declines an RA join request."""
    permission_classes = [IsAuthenticated, IsApproved]

    def patch(self, request, pk):
        join_req = generics.get_object_or_404(
            RAJoinRequest.objects.select_related("research", "ra"),
            pk=pk,
        )
        if join_req.research.author_id != request.user.id:
            return Response(
                {"detail": "Only the research author can decide on join requests."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if join_req.status != RAJoinRequestStatus.PENDING:
            return Response(
                {"detail": "This request has already been decided."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        decision = request.data.get("status")
        if decision not in (RAJoinRequestStatus.ACCEPTED, RAJoinRequestStatus.DECLINED):
            return Response(
                {"detail": "status must be 'accepted' or 'declined'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        join_req.status = decision
        join_req.save(update_fields=["status", "updated_at"])

        if decision == RAJoinRequestStatus.ACCEPTED:
            from apps.mentorship.models import ResearchCollaboration
            ResearchCollaboration.objects.get_or_create(
                requester=join_req.research.author,
                research_assistant=join_req.ra,
                defaults={"notes": f"Via RA join request on: {join_req.research.title}"},
            )

        return Response(RAJoinRequestSerializer(join_req).data)


class RAMyJoinRequestsView(generics.ListAPIView):
    """RA sees all their own join requests and their statuses."""
    serializer_class = RAJoinRequestSerializer
    permission_classes = [IsAuthenticated, IsApproved]

    def get_queryset(self):
        return RAJoinRequest.objects.filter(
            ra=self.request.user
        ).select_related("research", "ra").order_by("-created_at")


class ResearchCollaborationSettingsView(APIView):
    """Research author toggles open_for_collaboration and collaboration_description."""
    permission_classes = [IsAuthenticated, IsApproved]

    def patch(self, request, pk):
        research = generics.get_object_or_404(Research, pk=pk, author=request.user)
        research.open_for_collaboration = request.data.get(
            "open_for_collaboration", research.open_for_collaboration
        )
        research.collaboration_description = request.data.get(
            "collaboration_description", research.collaboration_description
        )
        research.save(update_fields=["open_for_collaboration", "collaboration_description", "updated_at"])
        return Response(ResearchSerializer(research, context={"request": request}).data)

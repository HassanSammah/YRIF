from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from apps.core.permissions import IsAdmin, IsApproved
from .models import Research, ResearchStatus
from .serializers import ResearchSerializer, ResearchReviewSerializer


class ResearchListView(generics.ListAPIView):
    """Public repository – only approved research is visible."""
    serializer_class = ResearchSerializer
    permission_classes = [AllowAny]
    filterset_fields = ["category"]
    search_fields = ["title", "abstract", "keywords"]

    def get_queryset(self):
        return Research.objects.filter(status=ResearchStatus.APPROVED).select_related("author")


class ResearchSubmitView(generics.CreateAPIView):
    serializer_class = ResearchSerializer
    permission_classes = [IsAuthenticated, IsApproved]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user, status=ResearchStatus.SUBMITTED)


class MyResearchView(generics.ListAPIView):
    serializer_class = ResearchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Research.objects.filter(author=self.request.user)


class ResearchDetailView(generics.RetrieveAPIView):
    serializer_class = ResearchSerializer

    def get_permissions(self):
        research = self.get_object()
        if research.status == ResearchStatus.APPROVED:
            return [AllowAny()]
        return [IsAuthenticated()]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=["views_count"])
        return super().retrieve(request, *args, **kwargs)

    def get_queryset(self):
        return Research.objects.all()


class ResearchReviewView(generics.CreateAPIView):
    serializer_class = ResearchReviewSerializer
    permission_classes = [IsAdmin]

    def perform_create(self, serializer):
        research = generics.get_object_or_404(Research, pk=self.kwargs["pk"])
        review = serializer.save(reviewer=self.request.user, research=research)
        if review.decision == "approve":
            research.status = ResearchStatus.APPROVED
        elif review.decision == "reject":
            research.status = ResearchStatus.REJECTED
        else:
            research.status = ResearchStatus.UNDER_REVIEW
        research.save(update_fields=["status"])
        # TODO: Notify author via email/SMS


class ResearchDownloadView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        research = generics.get_object_or_404(Research, pk=pk, status=ResearchStatus.APPROVED)
        research.downloads_count += 1
        research.save(update_fields=["downloads_count"])
        return Response({"document_url": request.build_absolute_uri(research.document.url)})

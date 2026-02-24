from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from apps.core.permissions import IsAdmin, IsApproved
from .models import MentorProfile, MentorshipRequest, MentorFeedback
from .serializers import MentorProfileSerializer, MentorshipRequestSerializer, MentorFeedbackSerializer


class MentorListView(generics.ListAPIView):
    serializer_class = MentorProfileSerializer
    permission_classes = [AllowAny]
    queryset = MentorProfile.objects.filter(is_available=True).select_related("user")
    search_fields = ["expertise_areas", "user__first_name", "user__last_name"]


class MentorDetailView(generics.RetrieveAPIView):
    serializer_class = MentorProfileSerializer
    permission_classes = [AllowAny]
    queryset = MentorProfile.objects.all()


class MentorshipRequestView(generics.ListCreateAPIView):
    serializer_class = MentorshipRequestSerializer
    permission_classes = [IsAuthenticated, IsApproved]

    def get_queryset(self):
        return MentorshipRequest.objects.filter(mentee=self.request.user)

    def perform_create(self, serializer):
        serializer.save(mentee=self.request.user)


class MatchMentorView(APIView):
    """Admin manually assigns a mentor to a pending request."""
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        mentorship = generics.get_object_or_404(MentorshipRequest, pk=pk)
        mentor_id = request.data.get("mentor_id")
        mentorship.mentor_id = mentor_id
        mentorship.status = MentorshipRequest.Status.MATCHED
        mentorship.save(update_fields=["mentor", "status"])
        # TODO: Notify mentee and mentor
        return Response(MentorshipRequestSerializer(mentorship).data)


class FeedbackView(generics.CreateAPIView):
    serializer_class = MentorFeedbackSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        mentorship = generics.get_object_or_404(MentorshipRequest, pk=self.kwargs["pk"])
        serializer.save(given_by=self.request.user, mentorship=mentorship)

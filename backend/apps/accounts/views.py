from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from apps.core.permissions import IsAdmin
from .models import User, Profile
from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    ProfileSerializer,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]


class LoginView(APIView):
    # JWT login handled by simplejwt; this view is a placeholder for BRIQ Auth integration
    permission_classes = [AllowAny]

    def post(self, request):
        # TODO: Integrate BRIQ Auth token exchange
        return Response({"detail": "Use /api/token/ for JWT auth."}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # TODO: Blacklist refresh token
        return Response(status=status.HTTP_204_NO_CONTENT)


class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        profile, _ = Profile.objects.get_or_create(user=self.request.user)
        return profile


class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    queryset = User.objects.all().select_related("profile")
    filterset_fields = ["role", "is_approved"]
    search_fields = ["email", "first_name", "last_name"]


class ApproveUserView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        user = generics.get_object_or_404(User, pk=pk)
        user.is_approved = True
        user.save(update_fields=["is_approved"])
        # TODO: Send approval email notification
        return Response({"detail": "User approved."})


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    queryset = User.objects.all()

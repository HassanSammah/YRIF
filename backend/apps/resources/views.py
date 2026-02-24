from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from apps.core.permissions import IsAdmin, IsContentManager
from .models import Resource, Webinar
from .serializers import ResourceSerializer, WebinarSerializer


class ResourceListView(generics.ListAPIView):
    serializer_class = ResourceSerializer
    permission_classes = [IsAuthenticated]
    queryset = Resource.objects.filter(is_published=True)
    filterset_fields = ["resource_type"]
    search_fields = ["title", "description"]


class ResourceDetailView(generics.RetrieveAPIView):
    serializer_class = ResourceSerializer
    permission_classes = [IsAuthenticated]
    queryset = Resource.objects.filter(is_published=True)


class WebinarListView(generics.ListAPIView):
    serializer_class = WebinarSerializer
    permission_classes = [AllowAny]
    queryset = Webinar.objects.filter(is_published=True)


class WebinarDetailView(generics.RetrieveAPIView):
    serializer_class = WebinarSerializer
    permission_classes = [AllowAny]
    queryset = Webinar.objects.filter(is_published=True)


class ResourceAdminView(generics.ListCreateAPIView):
    serializer_class = ResourceSerializer
    permission_classes = [IsContentManager]
    queryset = Resource.objects.all()

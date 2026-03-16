from django.db.models import F
from django.utils import timezone
from rest_framework import generics, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend

from apps.core.permissions import IsContentManager
from .models import Resource, Webinar
from .serializers import (
    ResourceSerializer,
    ResourceWriteSerializer,
    WebinarSerializer,
    WebinarWriteSerializer,
)


# ── Public: Resources ─────────────────────────────────────────────────────────

class ResourceListView(generics.ListAPIView):
    """Public list of published resources with search and type filtering."""
    serializer_class = ResourceSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["resource_type"]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "views_count", "downloads_count", "title"]

    def get_queryset(self):
        qs = Resource.objects.filter(is_published=True).select_related("created_by")
        tag = self.request.query_params.get("tag")
        if tag:
            qs = qs.filter(tags__contains=[tag])
        return qs


class ResourceDetailView(generics.RetrieveAPIView):
    """Public resource detail – increments views_count on each fetch."""
    serializer_class = ResourceSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Resource.objects.filter(is_published=True).select_related("created_by")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        Resource.objects.filter(pk=instance.pk).update(views_count=F("views_count") + 1)
        instance.refresh_from_db(fields=["views_count"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class ResourceDownloadView(APIView):
    """Increment downloads_count and return the file/link URL."""
    permission_classes = [AllowAny]

    def get(self, request, pk):
        resource = generics.get_object_or_404(Resource, pk=pk, is_published=True)
        Resource.objects.filter(pk=pk).update(downloads_count=F("downloads_count") + 1)

        url = resource.external_url
        if not url and resource.file:
            url = request.build_absolute_uri(resource.file.url)

        if not url:
            return Response({"detail": "No file or URL available."}, status=status.HTTP_404_NOT_FOUND)

        return Response({"url": url, "title": resource.title})


# ── Public: Webinars ──────────────────────────────────────────────────────────

class WebinarListView(generics.ListAPIView):
    """Public webinar list – filterable by upcoming/past and tag."""
    serializer_class = WebinarSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "description"]

    def get_queryset(self):
        qs = Webinar.objects.filter(is_published=True).select_related("created_by")
        when = self.request.query_params.get("when")  # upcoming | past
        if when == "upcoming":
            qs = qs.filter(scheduled_at__gte=timezone.now())
        elif when == "past":
            qs = qs.filter(scheduled_at__lt=timezone.now())
        tag = self.request.query_params.get("tag")
        if tag:
            qs = qs.filter(tags__contains=[tag])
        return qs


class WebinarDetailView(generics.RetrieveAPIView):
    """Public webinar detail – increments views_count."""
    serializer_class = WebinarSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Webinar.objects.filter(is_published=True).select_related("created_by")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        Webinar.objects.filter(pk=instance.pk).update(views_count=F("views_count") + 1)
        instance.refresh_from_db(fields=["views_count"])
        return Response(self.get_serializer(instance).data)


# ── Admin: Resources CRUD ─────────────────────────────────────────────────────

class AdminResourceListCreateView(generics.ListCreateAPIView):
    """Content managers: list ALL resources (including unpublished) and create new ones."""
    permission_classes = [IsContentManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["resource_type", "is_published"]
    search_fields = ["title"]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Resource.objects.all().select_related("created_by").order_by("-created_at")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ResourceWriteSerializer
        return ResourceSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(created_by=request.user)
        return Response(ResourceSerializer(instance, context={"request": request}).data, status=status.HTTP_201_CREATED)


class AdminResourceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Content managers: retrieve, update, or delete a resource."""
    permission_classes = [IsContentManager]
    queryset = Resource.objects.all()
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return ResourceWriteSerializer
        return ResourceSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = ResourceWriteSerializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(ResourceSerializer(instance, context={"request": request}).data)


# ── Admin: Webinars CRUD ──────────────────────────────────────────────────────

class AdminWebinarListCreateView(generics.ListCreateAPIView):
    """Content managers: list ALL webinars and create new ones."""
    permission_classes = [IsContentManager]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = ["is_published"]
    search_fields = ["title"]

    def get_queryset(self):
        return Webinar.objects.all().select_related("created_by").order_by("-scheduled_at")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return WebinarWriteSerializer
        return WebinarSerializer

    def create(self, request, *args, **kwargs):
        serializer = WebinarWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(created_by=request.user)
        return Response(WebinarSerializer(instance, context={"request": request}).data, status=status.HTTP_201_CREATED)


class AdminWebinarDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Content managers: retrieve, update, or delete a webinar."""
    permission_classes = [IsContentManager]
    queryset = Webinar.objects.all()

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return WebinarWriteSerializer
        return WebinarSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = WebinarWriteSerializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(WebinarSerializer(instance, context={"request": request}).data)

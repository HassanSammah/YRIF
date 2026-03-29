from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.db import connection
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
import time


def api_root(request):
    return JsonResponse({
        "name": "YRIF API",
        "version": "1.0.0",
        "status": "ok",
        "docs": "/api/docs/",
        "admin": "/admin/",
    })


def health_check(request):
    """NFR 6.4 Reliability — health probe used by load balancers / uptime monitors."""
    checks = {"status": "ok", "timestamp": time.time()}
    try:
        connection.ensure_connection()
        checks["database"] = "ok"
    except Exception:
        checks["database"] = "error"
        checks["status"] = "degraded"

    try:
        from django.core.cache import cache
        cache.set("_health", 1, 5)
        checks["cache"] = "ok"
    except Exception:
        checks["cache"] = "error"

    status_code = 200 if checks["status"] == "ok" else 503
    return JsonResponse(checks, status=status_code)


urlpatterns = [
    path("", api_root, name="home"),
    path("health/", health_check, name="health"),  # NFR 6.4
    path("admin/", admin.site.urls),
    # API schema
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    # App routes
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/research/", include("apps.research.urls")),
    path("api/v1/events/", include("apps.events.urls")),
    path("api/v1/mentorship/", include("apps.mentorship.urls")),
    path("api/v1/resources/", include("apps.resources.urls")),
    path("api/v1/admin/", include("apps.administration.urls")),
    path("api/v1/communications/", include("apps.communications.urls")),
    path("api/v1/public/", include("apps.outreach.urls")),
]

if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [path("__debug__/", include(debug_toolbar.urls))] + urlpatterns
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

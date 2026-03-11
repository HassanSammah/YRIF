from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


def api_root(request):
    return JsonResponse({
        "name": "YRIF API",
        "version": "1.0.0",
        "status": "ok",
        "docs": "/api/docs/",
        "admin": "/admin/",
    })


urlpatterns = [
    path("", api_root, name="home"),
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
]

if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [path("__debug__/", include(debug_toolbar.urls))] + urlpatterns
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

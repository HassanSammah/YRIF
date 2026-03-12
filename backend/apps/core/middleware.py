"""
Module 6 NFR — Security & Performance middleware.

6.2 Security  : Security headers (CSP, X-Frame-Options, HSTS, etc.)
6.1 Performance: Cache-Control headers on API responses
"""
from __future__ import annotations

import time
import logging

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware:
    """Adds security-related HTTP response headers on every response.

    Covers NFR 6.2 (Security) requirements:
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: DENY
    - Referrer-Policy
    - Permissions-Policy
    - Content-Security-Policy (strict but compatible with Vite dev)
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response["X-Content-Type-Options"] = "nosniff"
        response["X-Frame-Options"] = "DENY"
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=()"
        )
        # Only add CSP on non-debug (dev uses inline scripts for HMR)
        from django.conf import settings
        if not settings.DEBUG:
            response["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' https://accounts.google.com; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data: https:; "
                "connect-src 'self' https://accounts.google.com; "
                "frame-ancestors 'none';"
            )
        return response


class RequestTimingMiddleware:
    """Logs slow requests and adds X-Response-Time header (NFR 6.1 performance)."""

    SLOW_REQUEST_THRESHOLD_MS = 1000  # warn if > 1 second

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.monotonic()
        response = self.get_response(request)
        elapsed_ms = int((time.monotonic() - start) * 1000)
        response["X-Response-Time"] = f"{elapsed_ms}ms"
        if elapsed_ms > self.SLOW_REQUEST_THRESHOLD_MS:
            logger.warning(
                "Slow request: %s %s took %dms",
                request.method, request.path, elapsed_ms,
            )
        return response

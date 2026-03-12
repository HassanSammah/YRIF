"""Custom DRF exception handler — NFR 6.3 Usability (clear error responses)."""
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """Wraps DRF's default handler to ensure consistent error shape and logging."""
    response = exception_handler(exc, context)

    if response is None:
        # Unhandled exception — log and return 500
        logger.exception("Unhandled exception in %s", context.get("view"))
        return Response(
            {"detail": "An unexpected server error occurred. Please try again later."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Log 5xx errors
    if response.status_code >= 500:
        logger.error(
            "Server error %d in %s: %s",
            response.status_code, context.get("view"), response.data,
        )

    return response

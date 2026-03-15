from .base import *  # noqa
from decouple import config

DEBUG = True
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS += ["debug_toolbar"]  # noqa: F405
MIDDLEWARE += ["debug_toolbar.middleware.DebugToolbarMiddleware"]  # noqa: F405
INTERNAL_IPS = ["127.0.0.1"]

CORS_ALLOW_ALL_ORIGINS = True

# Use real SMTP when credentials are configured; fall back to console otherwise
_email_user = config("EMAIL_HOST_USER", default="")
EMAIL_BACKEND = (
    "django.core.mail.backends.smtp.EmailBackend"
    if _email_user
    else "django.core.mail.backends.console.EmailBackend"
)

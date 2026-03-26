from .base import *  # noqa
import sentry_sdk

DEBUG = False
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost").split(",")  # noqa: F405

CORS_ALLOWED_ORIGINS = config("CORS_ALLOWED_ORIGINS", default="").split(",")  # noqa: F405

# HTTPS security settings — only apply when running as a web server,
# not during management commands (migrate, collectstatic, etc.)
import sys  # noqa: E402
_is_web = not any(cmd in sys.argv for cmd in ("migrate", "makemigrations", "collectstatic", "shell"))

# nginx handles SSL termination and sets X-Forwarded-Proto: https.
# Django must NOT redirect HTTP→HTTPS itself (it would loop behind the proxy).
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = False   # nginx handles HTTP→HTTPS redirect
SECURE_HSTS_SECONDS = 31536000 if _is_web else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = _is_web
SESSION_COOKIE_SECURE = _is_web
CSRF_COOKIE_SECURE = _is_web

sentry_sdk.init(
    dsn=config("SENTRY_DSN", default=""),  # noqa: F405
    traces_sample_rate=0.2,
    environment="production",
)

from .base import *  # noqa
from decouple import config

DEBUG = True
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS += ["debug_toolbar"]  # noqa: F405
MIDDLEWARE += ["debug_toolbar.middleware.DebugToolbarMiddleware"]  # noqa: F405
INTERNAL_IPS = ["127.0.0.1"]

CORS_ALLOW_ALL_ORIGINS = True

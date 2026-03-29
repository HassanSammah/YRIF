from pathlib import Path
from datetime import timedelta
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config("SECRET_KEY")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "drf_spectacular",
    "corsheaders",
    "django_filters",
    # Internal apps
    "apps.core",
    "apps.accounts",
    "apps.research",
    "apps.events",
    "apps.mentorship",
    "apps.resources",
    "apps.administration",
    "apps.communications",
    "apps.outreach",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # NFR 6.2 Security headers + NFR 6.1 performance timing
    "apps.core.middleware.SecurityHeadersMiddleware",
    "apps.core.middleware.RequestTimingMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("DB_NAME"),
        "USER": config("DB_USER"),
        "PASSWORD": config("DB_PASSWORD"),
        "HOST": config("DB_HOST", default="localhost"),
        "PORT": config("DB_PORT", default="5432"),
    }
}

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": config("REDIS_URL", default="redis://localhost:6379/0"),
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
    }
}

# NFR 6.2 — Argon2 password hashing (more secure than PBKDF2)
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",  # fallback for existing passwords
]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

AUTH_USER_MODEL = "accounts.User"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.StandardPagination",
    "PAGE_SIZE": 20,
    # NFR 6.1 Performance — throttle to protect against abuse
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "60/min",
        "user": "300/min",
    },
    # NFR 6.3 — meaningful error messages
    "EXCEPTION_HANDLER": "apps.core.exceptions.custom_exception_handler",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "YRIF Platform API",
    "DESCRIPTION": "Youth Research & Innovation Foundation – MVP API",
    "VERSION": "1.0.0",
}

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Dar_es_Salaam"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# Briq Auth / SMS / OTP  (YRIF-App-Dev)
BRIQ_API_KEY = config("BRIQ_API_KEY", default="-7UxVFkdeQXKhKY1wMGrgJQpdw_z3slbkGBRKyJgwPw")
BRIQ_APP_KEY = config("BRIQ_APP_KEY", default="briq_mkb71g9z39n4frg0")
BRIQ_DEVELOPER_APP_ID = config("BRIQ_DEVELOPER_APP_ID", default=BRIQ_APP_KEY)  # defaults to BRIQ_APP_KEY if not set separately
BRIQ_SMS_SENDER = config("BRIQ_SMS_SENDER", default="YRIF")
BRIQ_BASE_URL = config("BRIQ_BASE_URL", default="https://karibu.briq.tz")
BRIQ_WEBHOOK_SECRET = config("BRIQ_WEBHOOK_SECRET", default="")  # set in BRIQ dashboard & env

# Google OAuth
GOOGLE_CLIENT_ID = config("GOOGLE_CLIENT_ID", default="350998195827-59nlf2oraqutqvags0f5qah6k6ggprg7.apps.googleusercontent.com")

# Supabase Realtime
SUPABASE_URL = config("SUPABASE_URL", default="")
SUPABASE_KEY = config("SUPABASE_KEY", default="")

# Sarufi AI — YRIF Chat (beta.sarufi.io)
SARUFI_API_KEY = config("SARUFI_API_KEY", default="")
SARUFI_BOT_ID = config("SARUFI_BOT_ID", default="")
SARUFI_BASE_URL = config("SARUFI_BASE_URL", default="https://developers.beta.sarufi.io/")
NGROK_BACKEND_URL = config("NGROK_BACKEND_URL", default="")

# Email — Brevo Transactional API
BREVO_API_KEY = config("BREVO_API_KEY", default="")
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="noreply@yriftz.org")
CONTACT_EMAIL = config("CONTACT_EMAIL", default="info@yriftz.org")
ADMIN_EMAIL_LIST = [CONTACT_EMAIL]

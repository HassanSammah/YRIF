FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements/ requirements/
RUN pip install --no-cache-dir -r requirements/production.txt

COPY . .

# collectstatic runs at build time and does NOT need a live database.
# The values below are build-time placeholders only — never used at runtime.
# Real secrets are injected by the container orchestrator at startup.
RUN SECRET_KEY=build-time-placeholder-not-used-at-runtime \
    DB_NAME=build DB_USER=build DB_PASSWORD=build \
    DB_HOST=localhost DB_PORT=5432 \
    python manage.py collectstatic --noinput --settings=config.settings.production

EXPOSE 8000

# Use an entrypoint script so the image works for both web and worker roles.
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120", "--access-logfile", "-"]

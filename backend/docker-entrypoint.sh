#!/bin/sh
set -e

# Wait for the database to be ready before starting
echo "Waiting for database..."
until python -c "
import sys, django
django.setup()
from django.db import connection
connection.ensure_connection()
print('Database ready.')
" 2>/dev/null; do
  echo "  ...database not ready yet, retrying in 2s"
  sleep 2
done

# Run migrations automatically on startup (idempotent — safe to run repeatedly)
echo "Running migrations..."
python manage.py migrate --no-input

exec "$@"

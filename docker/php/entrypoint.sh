#!/bin/bash
set -e

# Generate application key if not set
if [ -z "$APP_KEY" ]; then
    php artisan key:generate --force || true
fi

# Cache configuration for production
if [ "$APP_ENV" = "production" ]; then
    php artisan config:cache || true
    php artisan route:cache || true
    php artisan view:cache || true
fi

# Execute the main command
exec "$@"


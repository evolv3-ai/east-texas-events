#!/usr/bin/env sh
# Our copy of the upstream entrypoint (eventschedule/dockerfiles 787c990). Differences: the
# database wait reads credentials from the environment instead of pasting them into PHP source,
# and a missing APP_KEY is an error instead of a silently generated key.
set -e

cd /var/www/html

# Ensure .env exists. Real settings arrive as environment variables from the compose env_file,
# which Laravel prefers over this file.
[ -f .env ] || cp .env.example .env

# A key generated at start-up would differ between the app and scheduler containers and change
# on every rebuild, logging everyone out and making encrypted data unreadable.
if [ -z "${APP_KEY:-}" ]; then
  echo "APP_KEY is not set. Run ./init-env.sh to generate one." >&2
  exit 1
fi

# storage/ is a persisted named volume mounted over the image's directory, and this
# entrypoint runs as root. Create the runtime directories and hand them to the php-fpm
# user (www-data) so the workers can write logs/cache/sessions. Without this, files
# created here as root cause "permission denied" on storage/logs/laravel.log.
mkdir -p \
  storage/framework/cache \
  storage/framework/sessions \
  storage/framework/views \
  storage/logs \
  bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# Wait for DB (best-effort; compose already waits for the db healthcheck)
if [ -n "$DB_HOST" ]; then
  echo "Waiting for DB at ${DB_HOST}:${DB_PORT:-3306}..."
  i=0
  while : ; do
    if php -r 'try { new PDO("mysql:host=".getenv("DB_HOST").";port=".(getenv("DB_PORT") ?: "3306"), getenv("DB_USERNAME"), getenv("DB_PASSWORD")); } catch (Exception $e) { exit(1); }'; then
      break
    fi
    i=$((i+1))
    if [ "$i" -ge 60 ]; then
      echo "DB wait timeout after 60s, continuing..."
      break
    fi
    sleep 1
  done
fi

# Idempotent migrations
php artisan migrate --force

# Re-assert ownership in case artisan (run as root) created files in the storage volume.
chown -R www-data:www-data storage bootstrap/cache

exec "$@"

#!/usr/bin/env bash
# Nightly backup of the Event Schedule database and storage volume.
#
#   ./backup.sh            write today's archives, then delete ones older than BACKUP_KEEP_DAYS
#
# Writes two files to BACKUP_DIR: db-<stamp>.sql.gz and storage-<stamp>.tar.gz. Both settings
# come from .env (defaults: /var/backups/etex-eventschedule, 14 days). The stack must be running.
# .env itself is not backed up here; it holds APP_KEY, without which a restore cannot be read,
# and belongs in the secret store. Restore steps are in README.md.
set -euo pipefail

cd "$(dirname "$0")"

env_value() {
  # Last assignment of $1 in .env, with surrounding quotes removed. Empty if absent.
  local value
  value="$(grep -E "^$1=" .env 2>/dev/null | tail -n 1 | cut -d= -f2-)" || true
  value="${value%\"}"; value="${value#\"}"
  printf '%s' "$value"
}

backup_dir="${BACKUP_DIR:-$(env_value BACKUP_DIR)}"
backup_dir="${backup_dir:-/var/backups/etex-eventschedule}"
keep_days="${BACKUP_KEEP_DAYS:-$(env_value BACKUP_KEEP_DAYS)}"
keep_days="${keep_days:-14}"

case "$keep_days" in
  ''|*[!0-9]*) echo "backup: BACKUP_KEEP_DAYS must be a whole number, got '$keep_days'." >&2; exit 1 ;;
esac

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
umask 077
mkdir -p "$backup_dir"

db_tmp="$backup_dir/.db-$stamp.sql.gz.partial"
storage_tmp="$backup_dir/.storage-$stamp.tar.gz.partial"
trap 'rm -f "$db_tmp" "$storage_tmp"' EXIT

# The dump runs inside the db container with the credentials that container already holds, so
# no password appears on a command line or in this script. --single-transaction gives a
# consistent snapshot without locking the site.
docker compose exec -T db sh -c \
  'exec mariadb-dump --single-transaction --quick --routines --triggers \
     -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE"' \
  | gzip -9 > "$db_tmp"

# A dump cut short by a dropped connection still gzips cleanly; the trailer line is what proves
# mariadb-dump reached the end.
if ! gzip -dc "$db_tmp" | tail -n 1 | grep -q '^-- Dump completed'; then
  echo "backup: database dump is incomplete; nothing kept." >&2
  exit 1
fi

# Uploads, logs and anything else under storage/. Caches, sessions and compiled views are
# rebuilt by the app and left out.
docker compose exec -T app tar -C /var/www/html -czf - \
  --exclude=storage/framework/cache \
  --exclude=storage/framework/sessions \
  --exclude=storage/framework/views \
  storage > "$storage_tmp"

tar -tzf "$storage_tmp" > /dev/null

mv "$db_tmp" "$backup_dir/db-$stamp.sql.gz"
mv "$storage_tmp" "$backup_dir/storage-$stamp.tar.gz"
trap - EXIT

# Prune only after a good backup exists, so a run of failures never empties the directory.
find "$backup_dir" -maxdepth 1 -type f \
  \( -name 'db-*.sql.gz' -o -name 'storage-*.tar.gz' \) -mtime "+$keep_days" -delete

echo "backup: wrote $backup_dir/db-$stamp.sql.gz and $backup_dir/storage-$stamp.tar.gz"

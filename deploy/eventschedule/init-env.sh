#!/usr/bin/env bash
# Create .env from .env.example and fill in the generated secrets. Run once per install, on the
# machine that will run the stack. Refuses to touch an existing .env: regenerating APP_KEY or
# the database passwords would lock a live install out of its own data.
set -euo pipefail

cd "$(dirname "$0")"

if [ -e .env ]; then
  echo "init-env: .env already exists; leaving it alone." >&2
  exit 1
fi

command -v openssl >/dev/null || { echo "init-env: openssl is required." >&2; exit 1; }

app_key="base64:$(openssl rand -base64 32)"
db_password="$(openssl rand -hex 24)"
db_root_password="$(openssl rand -hex 24)"

umask 077
tmp="$(mktemp .env.XXXXXX)"
trap 'rm -f "$tmp"' EXIT

# Each key must appear exactly once and empty in the template, or a secret would be silently
# left blank.
for key in APP_KEY DB_PASSWORD DB_ROOT_PASSWORD; do
  if [ "$(grep -c "^${key}=\$" .env.example)" != 1 ]; then
    echo "init-env: expected one empty ${key}= line in .env.example." >&2
    exit 1
  fi
done

while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in
    APP_KEY=) printf 'APP_KEY=%s\n' "$app_key" ;;
    DB_PASSWORD=) printf 'DB_PASSWORD=%s\n' "$db_password" ;;
    DB_ROOT_PASSWORD=) printf 'DB_ROOT_PASSWORD=%s\n' "$db_root_password" ;;
    *) printf '%s\n' "$line" ;;
  esac
done < .env.example > "$tmp"

mv "$tmp" .env
trap - EXIT
chmod 600 .env

echo "init-env: wrote .env with a new APP_KEY and database passwords (not shown)."
echo "init-env: copy .env to the secret store, then review the REQUIRED settings in it."

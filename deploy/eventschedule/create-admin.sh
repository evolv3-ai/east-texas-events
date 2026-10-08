#!/usr/bin/env bash
# Create the one admin account on a fresh install and print its API key.
#
#   ./create-admin.sh owner@example.com "Full Name"
#
# Run it on the server after the first `docker compose up -d --build web scheduler` and before
# the proxy is started: until an account exists, whoever registers first owns the install.
# The request goes from the app container to nginx inside the Docker network, so it works
# without the proxy, DNS or TLS. The password is prompted for and passed on stdin; it never
# appears in the process list or the shell history.
set -euo pipefail

cd "$(dirname "$0")"

if [ "$#" -ne 2 ]; then
  echo "usage: $0 EMAIL \"FULL NAME\"" >&2
  exit 2
fi
email="$1"
name="$2"

read -rs -p "Password for $email (8 characters or more): " password; echo >&2
read -rs -p "Again: " again; echo >&2
if [ "$password" != "$again" ]; then echo "create-admin: the passwords differ." >&2; exit 1; fi
if [ "${#password}" -lt 8 ]; then echo "create-admin: the password is too short." >&2; exit 1; fi

api_key="$(printf '%s' "$password" | docker compose exec -T \
  -e ADMIN_EMAIL="$email" -e ADMIN_NAME="$name" app php -r '
    $body = json_encode([
        "name" => getenv("ADMIN_NAME"),
        "email" => getenv("ADMIN_EMAIL"),
        "password" => stream_get_contents(STDIN),
        "timezone" => "America/Chicago",
    ]);
    $context = stream_context_create(["http" => [
        "method" => "POST",
        "header" => "Content-Type: application/json\r\nAccept: application/json\r\n",
        "content" => $body,
        "ignore_errors" => true,
        "timeout" => 30,
    ]]);
    $response = file_get_contents("http://web/api/register", false, $context);
    $status = isset($http_response_header[0]) ? (int) explode(" ", $http_response_header[0])[1] : 0;
    $key = json_decode((string) $response, true)["data"]["api_key"] ?? null;
    if ($status !== 201 || ! $key) {
        fwrite(STDERR, "create-admin: registration failed (HTTP $status): $response\n");
        exit(1);
    }
    echo $key;
  ')"

# Registering through the API creates the account but only the web sign-up form grants admin.
admin_status=0
docker compose exec -T app php artisan app:make-admin "$email" >&2 || admin_status=$?

if [ "$admin_status" -eq 0 ]; then
  echo "create-admin: $email is the instance admin. Sign in at /login." >&2
else
  echo "create-admin: the account $email exists but could not be made the instance admin." >&2
  echo "create-admin: do not run this script again; sign-up is closed. Run this instead:" >&2
  echo "  docker compose exec -T app php artisan app:make-admin \"$email\"" >&2
fi
echo "create-admin: the API key below is shown once and expires in a year. Put it in the secret store." >&2
printf '%s\n' "$api_key"
exit "$admin_status"

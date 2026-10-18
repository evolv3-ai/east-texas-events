#!/usr/bin/env bash
# Exercise the production Caddyfile with real HTTP, without the application or production host.
set -euo pipefail
work=$(mktemp -d)
container="etex-proxy-test-$$"
pid=''
cleanup() {
  if [[ -n "$pid" ]]; then kill "$pid" 2>/dev/null || true; else docker rm -f "$container" >/dev/null 2>&1 || true; fi
  rm -rf "$work"
}
trap cleanup EXIT
mkdir -p "$work/static/releases/1-1" "$work/static/releases/2-1"
for file in events.json llms.txt openapi.json sitemap-index.xml; do
  printf 'release one %s\n' "$file" > "$work/static/releases/1-1/$file"
  printf 'release two %s\n' "$file" > "$work/static/releases/2-1/$file"
done
ln -s releases/1-1 "$work/static/current"
if [[ -n "${CADDY_BIN:-}" ]]; then
  sed "s|/srv/static/current|$work/static/current|; /^{$/a\\
  admin off" deploy/eventschedule/Caddyfile > "$work/Caddyfile"
  SITE_ADDRESS=http://127.0.0.1:18089 EDGE_TRUSTED_PROXIES=127.0.0.1 "$CADDY_BIN" run --config "$work/Caddyfile" --adapter caddyfile > "$work/caddy.log" 2>&1 &
  pid=$!
  base=http://127.0.0.1:18089
else
  docker run --rm -d --name "$container" -p 127.0.0.1::80 \
    -e SITE_ADDRESS=:80 -e EDGE_TRUSTED_PROXIES=127.0.0.1 \
    -v "$PWD/deploy/eventschedule/Caddyfile:/etc/caddy/Caddyfile:ro" \
    -v "$work/static:/srv/static:ro" caddy:2.10-alpine >/dev/null
  base="http://$(docker port "$container" 80/tcp)"
fi
ready=false
for _ in {1..30}; do
  if curl -sS --max-time 2 -o /dev/null "$base/events.json"; then ready=true; break; fi
  sleep 1
done
[[ "$ready" == true ]] || { cat "$work/caddy.log" 2>/dev/null || true; exit 1; }
for release in 1-1 2-1; do
  if [[ "$release" == 2-1 ]]; then ln -s releases/2-1 "$work/static/next"; mv -Tf "$work/static/next" "$work/static/current"; fi
  for file in events.json llms.txt openapi.json sitemap-index.xml; do
    curl -fsS --max-time 5 -D "$work/headers" "$base/$file" -o "$work/body"
    cmp "$work/body" "$work/static/releases/$release/$file"
    grep -qi '^Access-Control-Allow-Origin: \*' "$work/headers"
    grep -qi '^Cache-Control: .*no-cache' "$work/headers"
    case "$file" in
      *.json) grep -qi '^Content-Type: application/json' "$work/headers";;
      *.txt) grep -qi '^Content-Type: text/plain' "$work/headers";;
      *.xml) grep -Eqi '^Content-Type: (application|text)/xml' "$work/headers";;
    esac
  done
done
rm "$work/static/releases/2-1/events.json"
[[ $(curl -sS -o /dev/null -w '%{http_code}' "$base/events.json") == 404 ]]
[[ $(curl -sS -o /dev/null -w '%{http_code}' "$base/llms-full.txt") == 404 ]]
echo 'Caddy: all four routes, content types, CORS, cache policy, atomic switch and missing-file 404 passed.'

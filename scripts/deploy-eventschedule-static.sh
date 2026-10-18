#!/usr/bin/env bash
# CI-only transport. Validate locally before invoking; remote activation verifies transferred bytes.
set -euo pipefail
: "${ES_SSH_HOST:?}" "${ES_SSH_USER:?}" "${ES_SSH_KEY:?}" "${ES_SSH_KNOWN_HOSTS:?}" "${ES_STATIC_ROOT:?}" "${ES_BASE_URL:?}"
[[ "$ES_SSH_HOST" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]*$ ]]
[[ "$ES_SSH_USER" =~ ^[a-z_][a-z0-9_-]*$ ]]
[[ "$ES_STATIC_ROOT" =~ ^/[a-zA-Z0-9_./-]+$ && "$ES_STATIC_ROOT" != / && ! "$ES_STATIC_ROOT" =~ (^|/)\.\.(/|$) ]]
release="${GITHUB_RUN_ID:?}-${GITHUB_RUN_ATTEMPT:?}"
[[ "$release" =~ ^[1-9][0-9]*-[1-9][0-9]*$ ]]
args=()
if [[ "${ES_ALLOW_EMPTY:-false}" == true ]]; then args+=(--allow-empty); fi
npm run verify:eventschedule -- "${args[@]}"
ssh_dir=$(mktemp -d)
trap 'rm -rf "$ssh_dir"' EXIT
chmod 700 "$ssh_dir"
printf '%s\n' "$ES_SSH_KEY" > "$ssh_dir/key"
printf '%s\n' "$ES_SSH_KNOWN_HOSTS" > "$ssh_dir/known_hosts"
chmod 600 "$ssh_dir/"*
ssh_options=(-i "$ssh_dir/key" -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$ssh_dir/known_hosts" -o ConnectTimeout=15 -o ServerAliveInterval=15 -o ServerAliveCountMax=3)
remote="$ES_SSH_USER@$ES_SSH_HOST"
stage="$ES_STATIC_ROOT/releases/$release.incoming"
# A connection error after activation is ambiguous: always attempt compare-and-swap rollback.
rollback() {
  ssh "${ssh_options[@]}" "$remote" "bash -s -- rollback '$ES_STATIC_ROOT' '$release'" < deploy/eventschedule/activate-static.sh
}
ssh "${ssh_options[@]}" "$remote" "mkdir -p '$stage' && chmod 755 '$ES_STATIC_ROOT' '$ES_STATIC_ROOT/releases' '$stage'"
(cd dist-eventschedule && sha256sum events.json llms.txt openapi.json sitemap-index.xml > SHA256SUMS)
scp "${ssh_options[@]}" dist-eventschedule/{events.json,llms.txt,openapi.json,sitemap-index.xml,SHA256SUMS} "$remote:$stage/"
# Arm rollback before SSH: activation may finish remotely before the client returns.
trap 'rollback || true; exit 1' INT TERM
if ! ssh "${ssh_options[@]}" "$remote" "bash -s -- activate '$ES_STATIC_ROOT' '$release'" < deploy/eventschedule/activate-static.sh; then
  rollback || true
  exit 1
fi
# Allow transient network failures, but a rollout is never green until the public bytes match.
for attempt in 1 2 3 4 5; do
  if npm run verify:eventschedule -- --public "${args[@]}"; then exit 0; fi
  if [[ "$attempt" != 5 ]]; then sleep 5; fi
done
echo 'Public verification failed; restoring previous release' >&2
rollback
exit 1

#!/usr/bin/env bash
# Run on the server via SSH. Only the static directory is writable by this user.
set -euo pipefail
command=${1:?activate or rollback}; root=${2:?static root}; release=${3:?run-id-attempt}
[[ "$root" =~ ^/[a-zA-Z0-9_./-]+$ && "$root" != / && ! "$root" =~ (^|/)\.\.(/|$) ]]
[[ "$release" =~ ^[1-9][0-9]*-[1-9][0-9]*$ ]]
[[ "$command" == activate || "$command" == rollback ]]
cd "$root"
mkdir -p releases
exec 9>.publish.lock
flock -w 60 9
current=$(readlink current || true)
target="releases/$release"
if [[ "$command" == rollback ]]; then
  [[ "$current" == "$target" ]] || { echo 'Refusing rollback: another release is current' >&2; exit 1; }
  previous=$(cat "$target/.previous")
  if [[ -n "$previous" ]]; then
    [[ "$previous" =~ ^releases/[1-9][0-9]*-[1-9][0-9]*$ && -d "$previous" ]]
    ln -s "$previous" ".current-$release"
    mv -Tf ".current-$release" current
  else
    rm current
  fi
  echo "Rolled back $release"
  exit 0
fi
latest=$(cat .latest-release 2>/dev/null || true)
if [[ -n "$latest" && "$(printf '%s\n%s\n' "$latest" "$release" | sort -V | tail -1)" != "$release" ]]; then
  echo 'Refusing superseded release' >&2; exit 1
fi
if [[ "$current" == "$target" ]]; then
  echo "Already active: $release"; exit 0
fi
# A failed verification must be retried as a new Actions attempt, never silently reactivated.
[[ ! -e "$target" && ! -L "$target" ]]
stage="$target.incoming"
[[ -d "$stage" && ! -L "$stage" ]]
files=(events.json llms.txt openapi.json sitemap-index.xml)
for file in "${files[@]}"; do [[ -s "$stage/$file" && ! -L "$stage/$file" ]]; done
[[ -f "$stage/SHA256SUMS" && ! -L "$stage/SHA256SUMS" ]]
# Enforce the manifest's exact allowlist before sha256sum is allowed to read any path.
[[ $(wc -l < "$stage/SHA256SUMS") -eq 4 ]]
for file in "${files[@]}"; do
  [[ $(grep -Ec "^[a-f0-9]{64}  ${file//./\\.}$" "$stage/SHA256SUMS") -eq 1 ]]
done
(cd "$stage" && sha256sum --strict -c SHA256SUMS)
[[ -z "$current" || "$current" =~ ^releases/[1-9][0-9]*-[1-9][0-9]*$ ]]
printf '%s\n' "$current" > "$stage/.previous"
chmod 755 "$stage"
chmod 644 "$stage/"{events.json,llms.txt,openapi.json,sitemap-index.xml,SHA256SUMS,.previous}
mv -T "$stage" "$target"
printf '%s\n' "$release" > .latest-release.tmp
mv -T .latest-release.tmp .latest-release
ln -s "$target" ".current-$release"
mv -Tf ".current-$release" current
echo "Activated $release"

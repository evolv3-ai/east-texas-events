# Event Schedule for e-tex.events

A Docker Compose stack that runs [Event Schedule](https://github.com/eventschedule/eventschedule)
`v1.0.135` as the calendar at `https://e-tex.events/calendar`, on one plain Docker host behind
Cloudflare. It is separate from the Astro site in the rest of this repo and nothing here is part
of that site's build.

| File | What it is |
|---|---|
| `docker-compose.yml` | `proxy` (Caddy, TLS) → `web` (nginx) → `app` (php-fpm), plus `db` (MariaDB) and `scheduler` |
| `Dockerfile`, `docker-entrypoint.sh`, `nginx.conf` | Our copies of the upstream Docker files; each file's header lists what differs |
| `Caddyfile` | Certificate, `/` → `/calendar`, our four generated agent files, visitor address handling |
| `static/` | The files the proxy serves instead of the app, each one named in `Caddyfile`. Runtime releases and an atomic `current` symlink; no placeholder feeds are committed |
| `.env.example`, `init-env.sh` | Every setting, documented; and the script that creates `.env` with generated secrets |
| `create-admin.sh` | Creates the one admin account and prints its API key |
| `backup.sh` | Nightly database and storage backup |
| `smoke_test.py` | End-to-end check of a running install |

All commands below are run from this directory on the server.

## First deploy on a fresh Ubuntu server

Needs Ubuntu 24.04 with 2 GB of RAM (the image build is the hungry part; the running stack
idles at about 270 MB), ports 80 and 443 open, and `e-tex.events` pointing at the server through
Cloudflare.

1. Install Docker Engine and the Compose plugin: <https://docs.docker.com/engine/install/ubuntu/>.
2. Get this directory onto the server:
   ```bash
   git clone https://github.com/evolv3-ai/east-texas-events.git /opt/east-texas-events
   cd /opt/east-texas-events/deploy/eventschedule
   ```
3. Create `.env`. This generates `APP_KEY` and the two database passwords:
   ```bash
   ./init-env.sh
   ```
   Copy `.env` to the secret store now. A backup cannot be read without the `APP_KEY` in it.
   Then edit `.env` and fill in the `MAIL_*` settings; until you do, no email is sent. (Mail
   *to* the `@e-tex.events` addresses is a separate thing; see "Inbound mail" below.)
4. Build and start everything except the proxy, so nothing is reachable from outside yet. The
   first build takes several minutes:
   ```bash
   docker compose up -d --build web scheduler
   docker compose ps          # app, web and db should say "healthy"
   ```
5. **Create the admin account before opening the site** (next section). Until one exists, the
   first person to find the sign-up page owns the install.
6. Start the proxy, which opens ports 80 and 443:
   ```bash
   docker compose up -d
   ```

### TLS and Cloudflare

Caddy requests a Let's Encrypt certificate for `SITE_ADDRESS` by itself and renews it. Set
Cloudflare's SSL/TLS mode to **Full (strict)** once `docker compose logs proxy` shows the
certificate was obtained. If the first request for a certificate fails while the DNS record is
proxied, switch the record to "DNS only" until it succeeds, then turn the proxy back on.
Issuing a certificate has not been tested from this repo: it needs the real domain.

`EDGE_TRUSTED_PROXIES` in `.env` lists Cloudflare's address ranges. The proxy believes the
visitor address Cloudflare reports only when the request really comes from one of them.

## Admin account

```bash
./create-admin.sh owner@example.com "Full Name"
```

It asks for a password, creates the account, makes it the instance admin and prints an API key
on the last line. If the account is created but making it admin fails, the script still prints
the key, along with the one command to run again; the script itself cannot be rerun, because
sign-up is already closed. The key is shown once and expires after a year: put it in the secret
store and put the renewal on a calendar. A new key comes from **Settings → Developers** after
signing in. Sign-up closes as soon as this account exists.

## Calendar schedule, its path, and emails

Sign in at `https://e-tex.events/login`.

1. Create the main schedule: type **Curator**, name "East Texas Events", timezone
   `America/Chicago`.
2. Set its path. The API cannot do this, and a new schedule's path is taken from the first word
   of its name (`east`). Open the schedule, then **Edit → Settings → Schedule URL → Edit**,
   enter `calendar` in **Path**, and **Save**. `https://e-tex.events/` then lands on the calendar.
3. Give the schedule an email address (**Edit → Contact Info**).

**Every schedule needs an email, including every venue.** A schedule without one is served
with `noindex, nofollow`, is left out of the sitemaps, and takes its events with it: an event's
page lives under its venue's path. So create each venue explicitly with an `email`, never by
sending only a `venue_name` with an event, which creates a venue nobody owns. To check a page:

```bash
curl -s https://e-tex.events/calendar | grep -o '<meta name="robots"[^>]*>'
```

## Inbound mail for the @e-tex.events addresses

The admin login and the public contact address (shown on the calendar and copied onto every
venue the sync creates) are both `@e-tex.events` addresses, and neither is a mailbox. Both are
Cloudflare Email Routing custom addresses on the `e-tex.events` zone, forwarded to one private
destination mailbox; the actual addresses are in the deployment record in the secret store, not
in this repository. Enabling Email Routing added the zone's MX records and an SPF `TXT` record;
there was no other mail setup on the zone before.

It is managed in the Cloudflare dashboard under the `e-tex.events` zone, **Email → Email
Routing**, or through the `/zones/{zone_id}/email/routing/...` API. A new destination address
must be verified from a link Cloudflare emails to it before any rule can forward to it. This
covers inbound mail only; the `MAIL_*` settings above still decide how the app sends mail.

## Automated publication of agent files

The sync workflow now publishes `events.json`, `llms.txt`, `openapi.json` and
`sitemap-index.xml` after a successful live sync and successful ID-map persistence.
It validates every file against the same approved seed data and ID map, and checks the
successful sync report for every active event. Dry runs and runs outside `main` never publish.
A failed sync can still save its partial ID map, but cannot replace the public release.

The GitHub artifact remains available for inspection. It is not the deployment mechanism:
the runner uploads the four files and checksums over SSH, verifies the transfer on the server,
and atomically changes `static/current`. Caddy keeps the parent directory mounted, so it sees
the switch without restarting. The runner then checks all four ordinary public URLs for
status, content type, CORS and exact bytes. A failed public check rolls back the pointer and
fails the job. Older run IDs cannot overwrite newer releases. A failed release requires a new
Actions attempt; it cannot be silently reactivated.

### One-time setup and migration (review before production)

1. Test this branch with `npm ci`, `npm run build`, the Python regression command below and
   `bash deploy/eventschedule/test-proxy.sh` from the repository root. The proxy test needs
   Docker; it runs Caddy alone against temporary fixtures, without connecting to production.
2. On the Event Schedule host, create a dedicated unprivileged SSH account, for example
   `etex-publisher`. Give it write access only to this deployment's `static` directory and
   read/traverse access to its parents. Do not grant sudo, Docker-group membership, database
   credentials or write access to the application. Use a dedicated SSH key; disable forwarding
   and PTY for that key with `restrict` in `authorized_keys`. Shell access and SFTP are needed
   for the checksum/activation script and `scp`. The host needs Bash, GNU coreutils and `flock`
   (Ubuntu's `util-linux`). The static directory and release directories must be mode 755;
   published files are set to 644 for the read-only Caddy mount.
3. Configure these repository secrets and variables. Verify the host key out of band through
   the server console; do not trust an unverified `ssh-keyscan` result.

   - Secret `ES_BASE_URL`: `https://e-tex.events` (existing).
   - Secret `ES_API_KEY`: existing Event Schedule owner API key.
   - Secret `ES_SSH_HOST`: SSH-reachable origin hostname or IPv4 address, not the proxied web hostname.
   - Secret `ES_SSH_USER`: dedicated deployment account.
   - Secret `ES_SSH_KEY`: its OpenSSH private key.
   - Secret `ES_SSH_KNOWN_HOSTS`: pinned OpenSSH known-hosts entry for `ES_SSH_HOST` on port 22.
   - Variable `ES_STATIC_ROOT`: `/opt/east-texas-events/deploy/eventschedule/static` (adjust to the real checkout).
   - Variable `ES_CONTACT_EMAIL`: optional existing contact setting.

4. Install the reviewed Caddyfile on the server and validate it:

   ```bash
   docker compose exec -T proxy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
   docker compose exec -T proxy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
   ```

   If updating the host file replaced its inode, recreate only the proxy instead so the file
   bind mount reads the new configuration: `docker compose up -d --force-recreate proxy`.
   Do not replace the `static` parent directory. Remove the old tracked placeholder files as
   part of the reviewed checkout update. The new configuration intentionally returns 404 until
   the first validated release exists; schedule this short migration window. Existing calendar
   and API routes continue through the app.
5. After merge, run **Sync to Event Schedule** on `main` with `dry_run=false`. Inspect the
   **Deploy and verify public agent files** step. Confirm `static/current` points to
   `releases/<run-id>-<attempt>`, then run the read-only smoke check below. This establishes the
   first usable release; no committed sample feed is used as a fallback.

Missing deployment configuration is an error before any synchronization writes. Configuration
presence does not guarantee SSH reachability; a later SSH failure fails the job, keeps the saved
ID map and leaves the previous release active. Fix access and rerun the workflow.

### Read-only checks and freshness

From the repo root, using the generated bundle from the same run and its matching ID map:

```bash
ES_BASE_URL=https://e-tex.events npm run verify:eventschedule -- --public
python deploy/eventschedule/smoke_test.py --base-url https://e-tex.events --static-only
```

The first command compares exact generated bytes and seed/map consistency. The second needs
only Python and checks public file shape, counts, mapping coverage, placeholder text and a
48-hour freshness limit without an API key or writes. Use the read-only check in external
uptime monitoring as well: a workflow that never starts cannot report its own missed run.
Files more than five minutes in the future are rejected. Timestamp age is the publication age,
not a claim that every upstream event source was reverified on that date.

An empty upcoming feed stops automatic publication and requires curation. If there truly are
no upcoming events, dispatch once with `allow_empty=true`; this acknowledges emptiness but does
not bypass seed/map, freshness or exact-byte checks. Use `--allow-empty` for the corresponding
manual checks. Scheduled runs remain strict, so an exhausted seed cannot silently stay green.
Cancelled events retain the existing behavior: present in JSON, without an active event page.
Past mapped events remain in history but are not counted as upcoming.

### Rollback and retention

Automatic rollback only changes `current` if it still points to the failed release. It never
reverts event API changes or the ID map. To roll back the current bundle manually as the
publisher, from this directory:

```bash
bash activate-static.sh rollback /opt/east-texas-events/deploy/eventschedule/static <run-id>-<attempt>
```

The release records its previous pointer. On failure of the first release, rollback removes
`current`, leaving an honest 404. A broken or lost SSH connection can prevent rollback; the
workflow stays failed and an operator must check the pointer and public files. Do not describe
an unverified release as healthy. Retained directories are small and deliberately not deleted
automatically; remove old releases only after checking that neither `current` nor the current
release's `.previous` points to them. Do not reset `.latest-release` when cleaning up.

## Deployment regression tests

From the repository root:

```bash
npm test
python -m unittest discover -s deploy/eventschedule -p test_smoke_static.py
bash deploy/eventschedule/test-proxy.sh
```

The shell regression tests use real temporary directories, checksums, symlinks and locks. The
Caddy test verifies all four routes, MIME types, CORS, revalidation headers, atomic switching and
404 behavior through the actual production Caddyfile. CI runs these checks for every PR without
production credentials. For a local Caddy binary, set `CADDY_BIN=/path/to/caddy` on the proxy test.

## Smoke test

```bash
ES_API_KEY=... ./smoke_test.py --base-url https://e-tex.events
```

Creates a throwaway curator schedule, venue, sub-schedule, event and draft through the API,
checks the pages, feeds, sitemaps and structured data they produce, checks the proxy's
redirect and static files, and deletes what it made. Run it after every deploy and upgrade. It
exits non-zero if any check fails. Needs only Python 3.

## Backups

`backup.sh` writes `db-<time>.sql.gz` and `storage-<time>.tar.gz` to `BACKUP_DIR` and deletes
archives older than `BACKUP_KEEP_DAYS` (both in `.env`). Schedule it nightly as root:

```
15 8 * * * /opt/east-texas-events/deploy/eventschedule/backup.sh >> /var/log/etex-backup.log 2>&1
```

(08:15 UTC is the small hours in East Texas.) The archives stay on the server. Copying them
somewhere else is not set up here and is worth doing: a lost server loses its backups too.

### Restore

Onto a fresh server, do steps 1 to 3 of the first deploy but put the saved `.env` in place
instead of running `init-env.sh`. Onto the existing server, first stop everything except the
database: `docker compose stop proxy scheduler web app`. Then:

```bash
docker compose up -d db          # wait until `docker compose ps` shows it healthy

gunzip -c /path/to/db-<time>.sql.gz | docker compose exec -T db sh -c \
  'exec mariadb -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE"'

docker compose run --rm --no-deps -T --entrypoint sh app -c \
  'tar -C /var/www/html -xzf - && chown -R www-data:www-data storage' \
  < /path/to/storage-<time>.tar.gz

docker compose up -d
```

The dump replaces every table it contains. Finish with the smoke test.

## Upgrade

Upstream is one maintainer releasing several times a week, and `v1.0.135` shipped with a bug
that broke saving events. Read the
[release notes](https://github.com/eventschedule/eventschedule/releases) first, and try the new
version on your own machine (last section) before the server.

1. Find the commit the new tag points at:
   ```bash
   git ls-remote https://github.com/eventschedule/eventschedule.git refs/tags/v1.0.136
   ```
2. In a pull request, replace `v1.0.135` everywhere in `docker-compose.yml` and `Dockerfile`,
   and set `APP_COMMIT` in `Dockerfile` to that commit. The build fails if tag and commit
   disagree. Check `nginx.conf` and `docker-entrypoint.sh` against
   [upstream's](https://github.com/eventschedule/dockerfiles) for changes worth taking.
3. On the server:
   ```bash
   ./backup.sh                    # note the file names it prints
   git pull
   docker compose build
   docker compose up -d           # the app container applies database changes as it starts
   ES_API_KEY=... ./smoke_test.py --base-url https://e-tex.events
   ```

Do not use the in-app **App Update** button or `php artisan app:update`: they change files
inside a container and the change is gone at the next restart.

## Rollback

An upgrade changes the database, and the old version cannot be trusted to read the new layout.
Rolling back therefore means the old code **and** the backup taken in upgrade step 3. Anything
entered since that backup is lost.

```bash
git checkout <commit before the upgrade>
docker compose down
docker volume rm etex-eventschedule_dbdata     # the database only; uploads are kept
# then the four commands under "Restore", with the pre-upgrade archives
```

The database volume is removed rather than restored over because the failed upgrade may have
added tables the old dump knows nothing about; a fresh, empty database avoids leaving them
behind. The old images are still on the server under their version tag, so nothing is rebuilt.

## Running it on your own machine

```bash
./init-env.sh
```

then in `.env`:

```
SITE_ADDRESS=:80
APP_URL=http://localhost:18480
PROXY_HTTP_BIND=127.0.0.1:18480
PROXY_HTTPS_BIND=127.0.0.1:18443
EDGE_TRUSTED_PROXIES=127.0.0.1/32
APP_ENV=local
SESSION_SECURE_COOKIE=false
```

```bash
docker compose up -d --build web scheduler
./create-admin.sh you@example.com "Your Name"
docker compose up -d
ES_API_KEY=... ./smoke_test.py --base-url http://localhost:18480
docker compose down -v --rmi local     # removes containers, data and the built images
```

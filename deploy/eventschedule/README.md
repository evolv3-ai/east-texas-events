# Event Schedule for e-tex.events

A Docker Compose stack that runs [Event Schedule](https://github.com/eventschedule/eventschedule)
`v1.0.135` as the calendar at `https://e-tex.events/calendar`, on one plain Docker host behind
Cloudflare. It is separate from the Astro site in the rest of this repo and nothing here is part
of that site's build.

| File | What it is |
|---|---|
| `docker-compose.yml` | `proxy` (Caddy, TLS) → `web` (nginx) → `app` (php-fpm), plus `db` (MariaDB) and `scheduler` |
| `Dockerfile`, `docker-entrypoint.sh`, `nginx.conf` | Our copies of the upstream Docker files; each file's header lists what differs |
| `Caddyfile` | Certificate, `/` → `/calendar`, our own `/llms.txt` and `/events.json`, visitor address handling |
| `static/` | Files the proxy serves instead of the app. The two here are placeholders until the event sync job generates them |
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
   Then edit `.env` and fill in the `MAIL_*` settings; until you do, no email is delivered.
4. Build and start. The first build takes several minutes:
   ```bash
   docker compose up -d --build
   docker compose ps          # app, web and db should say "healthy"
   ```
5. **Create the admin account straight away** (next section). Until one exists, the first
   person to find the sign-up page owns the install.

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
on the last line. The key is shown once and expires after a year: put it in the secret store and
put the renewal on a calendar. A new key comes from **Settings → Developers** after signing in.
Sign-up closes as soon as this account exists.

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
docker compose up -d --build
./create-admin.sh you@example.com "Your Name"
ES_API_KEY=... ./smoke_test.py --base-url http://localhost:18480
docker compose down -v --rmi local     # removes containers, data and the built images
```

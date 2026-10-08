# East Texas Events

Static Astro site publishing a curated, RV-park-centered events feed. Serves both human (HTML) and agent (JSON / OpenAPI / `llms.txt`) surfaces from a single seed file.

**Status:** MVP. Seed events carry a `seed-fixture-verify-before-public-launch` risk flag — verify each against its `source_url` before public launch.

## Stack

Astro · TypeScript · Zod · static build · deploys to events.shallowcreek.com via Cloudflare Pages on every push to main

## Quickstart

```bash
git clone <repo>
cd east-texas-events
npm install
npm run dev               # http://localhost:4321/events/
npm run validate:data     # Zod-validate src/data/events.seed.json
npm run build             # astro check + validate:data + astro build
npm run preview           # preview production build
```

## Architecture

Everything flows through one seed file:

```
src/data/events.seed.json
  → src/lib/events/schema.ts   (Zod parsing — never bypassed)
  → src/lib/events/data.ts     (getApprovedEvents → getEventsFeed / getEventBySlug)
  → src/pages/*                (HTML + .json + llms.txt endpoints)
```

Public feed only includes events with `moderation.status === 'approved'`. Currency is hardcoded USD; timezone defaults to America/Chicago.

## Public surfaces

| Route | Purpose |
|---|---|
| `/events/` | Human index of all approved events |
| `/events/[slug]/` | Per-event detail page with JSON-LD |
| `/events/near-shallow-creek-rv-park/` | Events within ~15 miles of the park |
| `/events.json` | Agent-friendly JSON feed (schema `events-feed.v0.1`) |
| `/openapi.json` | OpenAPI 3.1 description of the JSON surfaces |
| `/llms.txt` | Plain-text usage guide for AI agents |

## Event Schedule sync

`scripts/sync-eventschedule.ts` pushes the seed file one way to a self-hosted [Event Schedule](https://eventschedule.com/) install, which is the display engine for e-tex.events. The repo stays the system of record; nothing is read back.

```bash
npm run sync:eventschedule -- --dry-run            # plan only, writes nothing (offline without credentials)
npm run sync:eventschedule                         # live: needs ES_BASE_URL and ES_API_KEY
npm run sync:eventschedule -- --archive            # also sync past events
npm run sync:eventschedule -- --dry-run --json     # machine-readable report
```

| Variable | Purpose |
|---|---|
| `ES_BASE_URL` | Origin of the install, for example `https://e-tex.events` |
| `ES_API_KEY` | API key of the account that owns the curator schedule (expires yearly) |
| `ES_CONTACT_EMAIL` | Email set on venue schedules, default the curator schedule's own |

What a run does:

- **Sends** only events that are approved, carry no `risk_flags`, are not cancelled and have not ended. Past events are sent only with `--archive`, and a synced event is left in place once it passes.
- **Removes** an event it previously sent when that event is no longer approved, gains a risk flag, is cancelled, or leaves the seed file. Events it did not create are never touched.
- **Venues** are Event Schedule schedules. Each is created once with its address and an email (without an email Event Schedule serves the venue page, and every event at it, as `noindex`).
- **Sub-schedule:** events in the 15-mile radius tier are filed under "Near Shallow Creek RV Park".
- **ID map:** `src/data/eventschedule-ids.json` pairs seed IDs with Event Schedule's and is bound to one install. An event or venue belongs to the sync only while the map names it, so anything missing from the map is created. The script saves the map after every create and delete, so an interrupted run keeps the IDs it got that far.
- **Static files:** `events.json`, `llms.txt`, `openapi.json` and `sitemap-index.xml` are written to `dist-eventschedule/` for the deployment to serve at the site root. `events.json` keeps an approved event that is cancelled, with its `cancelled` status, even though its Event Schedule page is removed.

The field mapping is in `src/lib/eventschedule/mapping.ts`. The curator schedule itself (path `calendar`, timezone, email, categories) is set up once in Event Schedule's admin panel; the sync refuses to run against a schedule that is not a curator.

`.github/workflows/sync.yml` runs the sync on every push to `main` and daily, commits the ID map back when it changes (also after a failed or cancelled run), and uploads the static files as the `eventschedule-static` artifact. It skips with a notice until the `ES_BASE_URL` and `ES_API_KEY` repository secrets exist, and it stops before sending anything if it cannot push to the branch or the branch is protected, because a run that creates events and then cannot commit the ID map would create them again next time.

### Duplicate events on the calendar

If a run creates events and the push of the ID map then fails, the next run no longer knows those events are its own and creates them again, so the calendar shows each twice. The sync never touches the unowned copies. To clean up, delete them in the Event Schedule admin panel (the copies whose URLs are not in `src/data/eventschedule-ids.json`), then re-run the workflow.

## Where to look

- `CLAUDE.md` — canonical project rules and architectural invariants (agent-facing, but readable by humans)
- `.claude/rules/workflow.md` — contribution workflow (superpowers + GitNexus)
- `docs/planning/IMPLEMENTATION_PLAN.md` — original Hermes build plan
- `docs/planning/agent-first-events-api-product-spec.md` — product spec
- `docs/planning/` — supporting research dossiers, source lists, schema drafts

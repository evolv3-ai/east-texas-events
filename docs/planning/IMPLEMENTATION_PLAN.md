# ShallowCreek.com Agent-First Events MVP — Implementation Plan

**Date:** 2026-05-10  
**Planning method:** planning-workflow  
**Primary launch domain:** ShallowCreek.com / Shallow Creek RV site  
**Future candidate domain:** easttexas.events  
**Future optional city authority domains:** tyler-tx.net, longview-tx.net  
**Hosting target:** Coolify server via GitHub app  
**Site stack direction:** Astro/static + serverless API where needed  
**Primary goal:** become a genuinely useful East Texas events information source for residents, visitors, organizers, journalists, businesses, answer engines, and search engines — with Shallow Creek RV booking as the business-aligned conversion path, not the only audience served.

---

## 0. Planning-workflow stance

This plan intentionally front-loads architecture, data contracts, crawlability, source strategy, and acceptance criteria before implementation. The goal is to make the build executable by agents without repeated clarification.

Implementation should not start by “making event cards.” Implementation starts by creating the stable data contract and build pipeline that lets event cards, API responses, JSON-LD, RSS, ICS, and future city-domain surfaces all render from one canonical event object.

### 0.1 Agent-ergonomics stance

This project must be easy for software agents, answer engines, crawlers, and human developers to understand without brittle screen-scraping. The public site is for humans; the data surfaces are for humans **and** agents.

Agent-oriented requirements:

- Every event, source, city, category, and feed has a stable ID, stable URL, predictable schema, and documented freshness semantics.
- Public JSON endpoints return deterministic, validated, pretty-inspectable data with ISO dates, explicit timezone, source links, confidence, and pagination/filter metadata.
- Dynamic endpoints, if added, return machine-readable errors with `code`, `message`, `details`, and `docs_url`.
- `openapi.json`, `llms.txt`, `/api/meta`, and `/api/sources` explain how an agent should use the system without guessing.
- Human pages expose the same facts visible in JSON-LD and feeds; no hidden schema claims.
- Event detail pages include source attribution, last checked/updated timestamps, confidence/freshness signals, and canonical links.
- CLI/build scripts should support `--help`, `--json`, dry-run modes, clear exit codes, and concise logs so future agents can run ingestion, validation, and publishing safely.

---

## 1. Current inputs and decisions

### Confirmed

- Start with **ShallowCreek.com** only.
- Treat the events feature as an **East Texas public-interest information asset**, not just an RV-park marketing widget. It must be useful to locals, visitors, event organizers, journalists, small businesses, families, schools, churches, chambers, and civic groups.
- Authority strategy: earn answer-engine/search-engine trust by being the most accurate, crawlable, source-linked, fresh, and reusable East Texas events dataset/page set available.
- Keep **easttexas.events** under consideration for later; do not make it the MVP canonical domain yet.
- Public website feature is the primary product surface.
- API exists to support the website, static generation, agents, and answer-engine extraction.
- Park coordinates: `32.4550931184018, -94.93548062084842`.
- Radius tiers for MVP:
  - `15` miles: nearby local events.
  - `50` miles: day-trip events.
- Source inventory exists at `east_texas_events_sources_60mi.md`.
- Source inventory has 315 rows covering 60 miles, but MVP will prioritize 15/50-mile tiers.
- Daily refresh is the initial target.
- AI moderation is acceptable.
- Scraping is acceptable, subject to robots/ToS/legal review and source-specific behavior.
- Voice: **travel concierge**.
- Canonical schema: custom internal model with JSON-LD projection to `schema.org/Event`.
- Ticketing means event admission / purchase info, not support tickets.
- Support/operations tickets remain internal only.
- Build target: Astro/static + serverless API on Coolify/GitHub.

### Unknown / blocked

- Exact Astro repo path and repo URL.
- Whether ShallowCreek.com already has a final route structure / design system.
- Whether a database is available/preferred on the Coolify server.
- Whether Coolify deployment uses Dockerfile, Nixpacks, static adapter, or custom build command.
- Whether Cloudflare/CDN is in front of ShallowCreek.com.
- Analytics stack: GA4, Plausible, PostHog, or none.
- Booking engine / booking CTA URL.

---

## 2. Source inventory analysis

Source file reviewed:

`N:\Dropbox\02_clients\Shallow Creek\Events API\east_texas_events_sources_60mi.md`

Generated derivative files:

- `east_texas_events_sources_prioritized.csv`
- `east_texas_events_sources_mvp_p0_p1.csv`

### Counts from source inventory

- Total source rows: **315**
- 0–15 miles: **60**
- 16–30 miles: **75**
- 31–45 miles: **95**
- 46–60 miles: **85**

Broad category counts from original source doc:

- venues/events/chambers/tourism/other: **99**
- city/municipal: **89**
- school districts: **83**
- newspapers/media: **26**
- county government: **18**

### Derived priority counts

A first-pass heuristic prioritized sources by distance, event-likelihood tags, ingestion class, and source quality:

- P0: **95**
- P1: **9**
- P2: **71**
- P3: **140**

MVP should **not** begin with all 315 sources. Start with P0/P1 sources, then expand after pipeline reliability is proven.

### Derived ingestion classes

- `calendar/scrape-or-feed`: 180
- `html-scrape`: 35
- `news-scrape`: 23
- `municipal-scrape`: 17
- `facebook/manual-or-api`: 9
- `aggregator/ticketing`: 4
- `unknown`: 47

### Initial P0 source examples

The first sources to validate should include:

- Gladewater Chamber of Commerce
- Gladewater Round-Up Rodeo
- Kilgore Chamber of Commerce
- Texas Shakespeare Festival
- The Back Porch Kilgore live music
- The Back Porch Eventbrite organizer
- Visit Kilgore Events
- City of Longview Calendar
- Visit Longview Event Calendar
- Longview Chamber Events
- Longview Convention Complex Event Calendar
- Longview Arboretum Calendar
- Great Texas Balloon Race
- Eventbrite Longview Events
- Eventbrite Tyler Events
- Visit Tyler Events
- City of Tyler Calendar
- Tyler Parks Event Calendar
- EGuide Calendar / Gig Guide
- The East Texas Weekend
- Tyler Area Chamber Events
- East Texas State Fair
- Texas Rose Festival
- Marshall Chamber Events
- Visit Marshall
- Wonderland of Lights

---

## 3. Product architecture

### 3.1 MVP architecture recommendation

Use a **static-first, generated-data architecture**:

```text
Source Inventory
  ↓
Daily Ingestion Job
  ↓
Raw Source Snapshots
  ↓
Extractor Adapters
  ↓
Canonical Event Records
  ↓
AI Moderation + Deduplication + Enrichment
  ↓
Generated Artifacts
  ├─ Astro pages
  ├─ /events.json
  ├─ /api/events or static JSON endpoint
  ├─ /events.rss.xml
  ├─ /events.ics
  ├─ /openapi.json
  └─ sitemap entries
  ↓
Coolify deploy from GitHub
```

### 3.2 Why static-first

Static-first is the right starting point because:

- Astro can ship crawlable initial HTML with minimal JS.
- AEO requires visible initial HTML, not client-only event hydration.
- Daily update cadence does not require a fully dynamic app.
- Coolify can deploy static builds reliably from GitHub.
- Static JSON files are easy for agents to fetch and inspect.
- Serverless/dynamic APIs can be added later without changing the canonical event model.

### 3.3 Database decision

There are two viable MVP tracks.

#### Track A — Generated JSON first

Store source inventory, raw fetched content, normalized events, and moderation state in repo/data files or a server-side data directory.

Pros:

- fastest implementation;
- easiest deploy/debug;
- no database administration;
- simple static build.

Cons:

- moderation workflow is less convenient;
- history/dedupe can become clunky;
- concurrent edits harder.

#### Track B — SQLite/Postgres first

Use SQLite or Postgres on the Coolify server for ingestion state, dedupe, moderation, and generated output.

Pros:

- better for source health, moderation, history;
- more robust daily ingestion;
- easier future admin UI.

Cons:

- more setup;
- backups/migrations needed;
- deployment is more complex.

#### Recommendation

Start with **Track A plus a clean repository data model**, but design the data access layer so it can swap to SQLite/Postgres later.

Concretely:

- `data/sources/sources.csv`
- `data/raw/<source_id>/<date>.html|json`
- `data/events/canonical-events.json`
- `data/events/approved-events.json`
- `data/moderation/moderation-log.jsonl`
- `data/build/events-public.json`

If the first implementation immediately needs review queues, source state, and historical dedupe, move to SQLite sooner.

---

## 4. Repository layout proposal

Assuming the Astro repo is not yet inspected, use this target shape:

```text
/
├─ astro.config.*
├─ package.json
├─ src/
│  ├─ pages/
│  │  ├─ events/
│  │  │  ├─ index.astro
│  │  │  ├─ this-weekend.astro
│  │  │  ├─ near-shallow-creek-rv-park.astro
│  │  │  ├─ longview-tx.astro
│  │  │  ├─ tyler-tx.astro
│  │  │  ├─ kilgore-tx.astro
│  │  │  ├─ gladewater-tx.astro
│  │  │  ├─ marshall-tx.astro
│  │  │  └─ [slug].astro
│  │  ├─ events.json.ts
│  │  ├─ events.rss.xml.ts
│  │  └─ events.ics.ts
│  ├─ components/
│  │  ├─ events/EventCard.astro
│  │  ├─ events/EventList.astro
│  │  ├─ events/EventFilters.astro
│  │  └─ events/BookingCTA.astro
│  ├─ lib/
│  │  ├─ events/
│  │  │  ├─ schema.ts
│  │  │  ├─ load-events.ts
│  │  │  ├─ filters.ts
│  │  │  ├─ jsonld.ts
│  │  │  ├─ rss.ts
│  │  │  ├─ ics.ts
│  │  │  └─ scoring.ts
│  │  └─ seo/
│  │     ├─ metadata.ts
│  │     └─ structured-data.ts
│  └─ styles/
├─ data/
│  ├─ sources/
│  │  ├─ sources.csv
│  │  └─ sources.prioritized.csv
│  ├─ events/
│  │  ├─ seed-events.json
│  │  ├─ canonical-events.json
│  │  └─ approved-events.json
│  └─ moderation/
│     └─ moderation-log.jsonl
├─ scripts/
│  ├─ events/
│  │  ├─ ingest.ts
│  │  ├─ fetch-source.ts
│  │  ├─ extract.ts
│  │  ├─ normalize.ts
│  │  ├─ geocode.ts
│  │  ├─ dedupe.ts
│  │  ├─ moderate.ts
│  │  ├─ enrich.ts
│  │  └─ build-public-events.ts
│  └─ verify/
│     ├─ verify-events-json.ts
│     ├─ verify-jsonld.ts
│     └─ verify-agent-contract.ts
├─ public/
│  ├─ openapi.json
│  └─ llms.txt
└─ docs/
   ├─ events-api.md
   └─ source-adapters.md
```

---

## 5. Canonical data contracts

### 5.1 Source record

```ts
export type EventSource = {
  id: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  name: string;
  url: string;
  place: string;
  miles_from_park: number;
  radius_tier: '15' | '50' | '60';
  tags: string[];
  ingestion_class:
    | 'calendar/scrape-or-feed'
    | 'html-scrape'
    | 'news-scrape'
    | 'municipal-scrape'
    | 'facebook/manual-or-api'
    | 'aggregator/ticketing'
    | 'school-calendar'
    | 'unknown';
  trust_score: number;
  active: boolean;
  notes?: string;
  last_checked_at?: string;
  last_success_at?: string;
  last_error?: string;
};
```

### 5.2 Canonical event record

Use the canonical event model from `agent-first-events-api-product-spec.md` as the source of truth. Implementation should define it as a runtime-validated schema, preferably Zod.

Required MVP fields:

```ts
export type EventStatus = 'scheduled' | 'cancelled' | 'postponed' | 'tentative' | 'past';

export type CanonicalEvent = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  agent_summary?: string;
  why_go?: string;

  start_at: string;
  end_at?: string;
  timezone: string;
  all_day?: boolean;
  status: EventStatus;

  location: {
    name?: string;
    address1?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };

  geo: {
    distance_from_park_miles?: number;
    radius_tier?: 15 | 50;
    estimated_drive_time_minutes?: number;
  };

  links: {
    web_url?: string;
    source_url: string;
    tickets_url?: string;
    calendar_url?: string;
  };

  admission: {
    is_free?: boolean;
    requires_ticket?: boolean;
    registration_required?: boolean;
    price_min?: number;
    price_max?: number;
    currency?: 'USD';
    availability?: 'available' | 'sold_out' | 'cancelled' | 'unknown' | 'not_applicable';
    purchase_url?: string;
  };

  categories: string[];
  tags: string[];

  rv_context: {
    family_friendly?: boolean;
    pet_friendly?: boolean | null;
    outdoor?: boolean;
    rainy_day_friendly?: boolean;
    senior_friendly?: boolean;
    rv_parking_notes?: string;
    ideal_stay_length_days?: number;
    booking_prompt?: string;
  };

  relevance: {
    score: number;
    score_version: string;
    reasons: string[];
  };

  source: {
    name: string;
    type: string;
    source_event_id?: string;
    source_url: string;
    first_seen_at?: string;
    last_seen_at: string;
    confidence: number;
  };

  moderation: {
    status: 'pending' | 'approved' | 'rejected' | 'needs_review';
    reviewed_by?: 'ai' | 'human';
    reviewed_at?: string;
    risk_flags: string[];
  };

  created_at: string;
  updated_at: string;
};
```

---

## 6. MVP page plan

### 6.1 Launch pages

Start with the following indexable pages:

1. `/events/`
2. `/events/this-weekend/`
3. `/events/near-shallow-creek-rv-park/`
4. `/events/longview-tx/`
5. `/events/tyler-tx/`
6. `/events/kilgore-tx/`
7. `/events/gladewater-tx/`
8. `/events/marshall-tx/`
9. `/events/family-friendly/`
10. `/events/live-music/`
11. `/events/festivals/`
12. `/events/outdoor/`
13. `/events/free/`
14. `/events/[slug]/` for curated approved events only.

### 6.2 Non-indexed or deferred pages

Avoid generating thin pages for every place/source/category/date combination at MVP.

Do not launch these until data density is proven:

- `/events/{every-small-town}/`
- `/events/{source}/`
- `/events/{exact-date}/`
- `/events/{tag}/` for low-volume tags
- arbitrary filtered indexable URLs

### 6.3 Public-authority content requirements

Because the goal is to serve all East Texans, not only RV guests, pages must answer general community questions first and then provide Shallow Creek context where relevant.

Each major page should help at least three of these audiences without requiring them to be park customers:

- East Texas residents looking for weekend plans;
- families comparing kid-friendly/free/outdoor options;
- visitors planning a day trip;
- event organizers checking how events are represented;
- journalists/bloggers looking for source-linked event facts;
- chambers, CVBs, and small businesses looking for accurate local visibility;
- agents/answer engines looking for clean, cited, fresh event data.

Do not over-optimize every page around booking. Booking CTAs should be present and useful, but the authority moat comes from the dataset being broadly valuable, source-linked, fresh, and trustworthy.

### 6.4 Page quality gates

Each indexable page must have:

- unique H1;
- useful intro copy in travel-concierge voice;
- visible last-updated timestamp;
- visible event count;
- at least 3–5 useful event listings or a no-events fallback with evergreen guidance;
- internal links to related city/category/weekend pages;
- booking CTA;
- source/freshness statement;
- JSON-LD rendered in initial HTML;
- no client-only event content.

---

## 7. API / feed plan

### 7.1 Static endpoints first

Implement these as static Astro endpoints where possible:

- `/events.json`
- `/events.rss.xml`
- `/events.ics`
- `/openapi.json`
- `/llms.txt`

### 7.2 API routes

If serverless functions are available via Coolify hosting, also add:

- `/api/events`
- `/api/events/{id}`
- `/api/sources`
- `/api/meta`

If serverless functions are not straightforward, use static JSON endpoints first and defer dynamic `/api/*` routes.

### 7.3 Agent-first contract checks

Apply the `agent-ergonomics-and-intuitiveness-maximization-for-cli-tools` stance to every machine interface. Agents should never need to infer basic semantics from prose pages or brittle DOM selectors.

Add verification that ensures:

- `/events.json` returns valid JSON.
- JSON responses include `schema_version`, `generated_at`, `timezone`, `source_count`, `event_count`, and filter metadata where applicable.
- All event IDs are stable and unique.
- All slugs are stable and unique.
- Dates are ISO-8601.
- Timezone is present.
- Source URL is present.
- Public source attribution is present for every event.
- Events have `agent_summary` before approval.
- Agent/RAG fields are concise, non-hypey, and grounded in visible/source-linked facts.
- `openapi.json` is valid if shipped.
- `llms.txt` points agents to event feeds, source policy, sitemap, and docs.
- Errors are machine-readable for dynamic API endpoints.
- Validation scripts can emit `--json` output and return non-zero exit codes on schema/freshness failures.

---

## 8. Ingestion plan

### 8.1 Adapter interface

Every source adapter should return the same intermediate type:

```ts
export type RawEventCandidate = {
  source_id: string;
  source_name: string;
  source_url: string;
  fetched_at: string;
  raw_title?: string;
  raw_description?: string;
  raw_start?: string;
  raw_end?: string;
  raw_location?: string;
  raw_venue?: string;
  raw_city?: string;
  raw_ticket_url?: string;
  raw_event_url?: string;
  raw_image_url?: string;
  raw_text?: string;
  raw_json?: unknown;
};
```

Then normalize to `CanonicalEvent`.

### 8.2 First adapter classes

Build adapter classes in this order:

1. **Static/manual seed adapter** — proves the full site/API pipeline without scraping.
2. **Generic HTML event list adapter** — handles many venue/chamber/tourism pages.
3. **Eventbrite adapter** — ticket/admission-rich source.
4. **Calendar/ICS adapter** — if source exposes ICS or embedded calendar data.
5. **Facebook/manual adapter** — later due to fragility and terms/permission issues.
6. **Newspaper adapter** — later; useful but extraction ambiguity is higher.

### 8.3 P0 source pilot

Pick 8–12 P0 sources for first real ingestion:

- Visit Longview Event Calendar
- City of Longview Calendar
- Longview Chamber Events
- Longview Convention Complex Event Calendar
- Visit Kilgore Events
- Kilgore Chamber
- The Back Porch Kilgore live music
- The Back Porch Eventbrite organizer
- Visit Tyler Events
- Tyler Area Chamber Events
- Eventbrite Longview
- Eventbrite Tyler

Success criterion: daily ingestion yields a small but high-quality set of approved events with valid dates, venues, source links, and event pages.

---

## 9. AI moderation and enrichment plan

### 9.1 Moderation outputs

Every candidate event should receive:

- `moderation.status`
- `risk_flags[]`
- `source.confidence`
- `agent_summary`
- `categories[]`
- `tags[]`
- `rv_context`
- `relevance.score`
- `relevance.reasons[]`

### 9.2 Auto-approve rules

Auto-approve when:

- source priority is P0/P1;
- source confidence is >= 0.75;
- title is present;
- start date is present;
- location or city is present;
- event is public;
- event is within 15/50-mile tier or target city;
- not a duplicate of an already approved event;
- no disallowed risk flags.

### 9.3 Needs-review rules

Flag for review when:

- date/time conflict;
- location cannot be geocoded;
- source is low trust;
- event appears cancelled/postponed;
- price/ticket availability is unclear but claimed;
- Facebook-only event;
- adult/sensitive/political content;
- duplicate confidence is ambiguous.

---

## 10. SEO/AEO implementation checklist

### 10.1 Technical SEO

- Static event HTML present at build time.
- Unique title/meta per indexable page.
- Canonical URL per page.
- Sitemap includes canonical event pages only.
- No indexable pages for low-value filters.
- Event pages removed or marked past appropriately after expiration.
- JSON-LD mirrors visible content.
- Source attribution visible.

### 10.2 AI visibility

- Event pages include self-contained, quotable summary.
- Hub pages include citation-ready passage describing coverage, update cadence, and region.
- `/openapi.json` documents the public event feed.
- `/events.json` is simple and crawlable.
- `llms.txt` can be added as a navigation aid, but not treated as a ranking lever.
- Important content must appear in raw HTML.

### 10.3 Booking conversion

Every event hub/detail page should include a relevant CTA:

- “Book a weekend RV site”
- “Use Shallow Creek as your East Texas basecamp”
- “Check availability for this event weekend”

Track clicks separately by page type and event ID.

---

## 11. Coolify deployment plan

### 11.1 Assumptions

- GitHub app will connect repo to Coolify.
- Coolify will run build on push.
- Astro build output will be served as static files or Node adapter output.
- Daily ingestion can run via one of:
  - GitHub Actions committing generated data;
  - Coolify scheduled job;
  - server cron on Coolify host;
  - separate worker container.

### 11.2 Recommended deployment flow

For MVP, prefer this flow:

```text
GitHub repo
  ↓ push
Coolify build
  ↓
npm install / pnpm install
  ↓
npm run build
  ↓
serve Astro dist
```

For daily data refresh, pick one:

#### Option A — GitHub Actions refresh

- Scheduled GitHub Action runs ingestion daily.
- Writes generated JSON/pages data.
- Commits generated data back or uploads artifact.
- Coolify deploys after commit.

Pros: easy audit trail.  
Cons: committing generated data can be noisy.

#### Option B — Coolify scheduled worker

- Worker runs ingestion daily on server.
- Updates data store or generated public files.
- Triggers rebuild/redeploy.

Pros: keeps generated churn out of git.  
Cons: more server setup.

#### Recommendation

Start with **manual/seed data committed to repo**, then choose Option A or B after the Astro repo and Coolify setup are inspected.

---

## 12. Implementation phases and tasks

### Phase 1 — Repo discovery and foundation

Blocked until Astro repo path is known.

Tasks:

1. Inspect repo structure.
2. Identify Astro version, package manager, adapters, deployment config.
3. Identify content/data patterns already in use.
4. Identify booking CTA/link integration.
5. Add event schema module and seed data.
6. Add validation script.

Acceptance criteria:

- `npm/pnpm run build` passes.
- Event schema validation passes on seed events.
- No unrelated site regressions.

### Phase 2 — Static events pages

Tasks:

1. Build event card/list components.
2. Build `/events/` hub.
3. Build city/category/weekend pages.
4. Build event detail page route.
5. Add booking CTA component.
6. Add JSON-LD projection.
7. Add metadata/canonical support.

Acceptance criteria:

- Pages render from seed data.
- Raw HTML contains event content.
- JSON-LD is valid JSON and mirrors visible data.
- Build passes.

### Phase 3 — Public feeds and agent contract

Tasks:

1. Add `/events.json`.
2. Add `/events.rss.xml`.
3. Add `/events.ics`.
4. Add `/openapi.json`.
5. Add `/api/meta` or static equivalent.
6. Add agent-contract verification script.

Acceptance criteria:

- Feeds are valid.
- `events.json` includes stable IDs, source URLs, agent summaries, timestamps, and radius tiers.
- OpenAPI describes available endpoints or static feeds accurately.

### Phase 4 — Source ingestion MVP

Tasks:

1. Import prioritized source CSV.
2. Build static/manual seed adapter.
3. Build generic fetcher with rate limits and user-agent.
4. Build first 2–3 source-specific adapters.
5. Add dedupe/geocode placeholders.
6. Add moderation/enrichment pass.
7. Produce approved events file.

Acceptance criteria:

- Ingestion run produces approved events from pilot sources.
- Failures are logged by source.
- Events have source attribution and confidence.

### Phase 5 — Daily refresh and Coolify deployment

Tasks:

1. Choose refresh mechanism.
2. Add scheduled ingestion job.
3. Add deployment/rebuild trigger.
4. Add monitoring output.
5. Add source health report.

Acceptance criteria:

- Daily job runs without manual intervention.
- Broken sources are visible.
- Site updates after successful ingestion.

### Phase 6 — Measurement and iteration

Tasks:

1. Add event page analytics.
2. Track booking CTA clicks.
3. Add search/AEO monitoring sheet or scripts.
4. Review top queries and page performance after indexation.
5. Expand source coverage based on quality and demand.

Acceptance criteria:

- Can report event-page sessions and booking CTA clicks.
- Can identify source/page clusters driving impressions.

---

## 13. Build prerequisites needed from user

Before code implementation, collect:

1. Astro repo path or GitHub repo URL.
2. Current ShallowCreek.com production/staging URL.
3. Booking engine URL or CTA destination.
4. Coolify project/app details:
   - static build or Node app?
   - package manager?
   - env var/secrets mechanism?
5. Whether daily ingestion should run via GitHub Actions, Coolify scheduled job, or server cron.
6. Any sources that must be excluded for legal/relationship reasons.
7. Whether easttexas.events should be purchased/reserved now, even if not MVP.

---

## 14. Validation commands once repo exists

These should exist before launch:

```bash
npm run build
npm run check
npm run validate:events
npm run validate:jsonld
npm run validate:agent-contract
```

If using Playwright or a simple fetch verifier:

```bash
npm run verify:events-pages
npm run verify:feeds
```

---

## 15. Done definition for MVP

The MVP is complete when:

- ShallowCreek.com has crawlable Astro event pages.
- At least 20–50 approved high-quality events render from the canonical model.
- `/events/`, `/events/this-weekend/`, city pages, category pages, and event detail pages exist.
- `/events.json`, RSS, and ICS feeds are available.
- JSON-LD is emitted for event detail pages and validates syntactically.
- Booking CTAs are present and tracked.
- Event source attribution and last-updated timestamps are visible.
- The source pipeline can refresh at least pilot sources daily.
- An agent can fetch the public feed and reliably answer: “What events are happening near Shallow Creek RV Park this weekend?”

---

## 16. Recommended next action

Next, inspect the actual Astro repo. Once the repo path is known, execute Phase 1 by adding:

1. canonical event schema;
2. seed event data;
3. event loader;
4. validation script;
5. static `/events/` prototype page.

Do **not** begin with all 315 sources. Prove the end-to-end ShallowCreek.com event surface with seed events and 8–12 P0 pilot sources first.

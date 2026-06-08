---
title: "Agent-First East Texas Events API Product Spec"
date: "2026-05-10"
project: "Shallow Creek RV Park / East Texas Events Authority"
status: "Draft v0.1"
owner: "Shallow Creek RV Park"
primary_goal: "Book RV sites and grow East Texas events search/AI visibility"
---

# Agent-First East Texas Events API Product Spec

## 1. Executive summary

Shallow Creek RV Park should build an **agent-first public events website + API** that makes the park a useful answer source for:

- humans planning RV stays in East Texas;
- Google Search / AI Overviews / AI Mode;
- ChatGPT, Perplexity, Claude, and other answer engines;
- future travel-planning agents looking for structured local trip data.

The first product should feel like a **travel concierge for East Texas events**, not a generic event dump. The public website is the primary surface. The API, JSON feeds, schema.org projections, and agent-oriented metadata exist to make that website easier for search engines and AI agents to crawl, quote, summarize, and recommend.

Primary business outcomes:

1. **Book RV sites** at Shallow Creek.
2. **Grow traffic** from East Texas event and travel-planning queries.
3. Build authority around **East Texas, Longview, Tyler, Kilgore, Gladewater, and Marshall**.
4. Position Shallow Creek, and possibly `tyler-tx.net` / `longview-tx.net`, as reliable local event discovery properties.

---

## 2. Strategic positioning

### 2.1 Working thesis

Most RV park websites treat nearby events as static content. Shallow Creek can win by becoming a structured, frequently updated **East Texas event intelligence layer**.

The moat is not just having events. The moat is having events with fields an agent can actually use:

- clean title and description;
- exact dates/times/timezone;
- geocoded venue;
- distance from Shallow Creek;
- city/region tags;
- ticket/admission information;
- family/pet/outdoor suitability;
- RV-specific travel notes;
- source attribution and freshness;
- concise agent summaries and trip-planning notes.

### 2.2 Recommended brand architecture options

There are three plausible approaches.

#### Option A — Shallow Creek owns everything

Example URLs:

- `shallowcreekrv.com/events/`
- `shallowcreekrv.com/events/this-weekend/`
- `shallowcreekrv.com/events/longview-tx/`

Pros:

- strongest booking attribution;
- all authority accrues to the RV park domain;
- simplest technically and editorially.

Cons:

- some users may perceive it as a park marketing feature rather than a neutral regional events authority.

#### Option B — Standalone East Texas events site sponsored by Shallow Creek

Example URLs:

- `easttexasevents.com` if acquired;
- `events.tyler-tx.net`;
- `events.longview-tx.net`;
- “Sponsored by Shallow Creek RV Park.”

Pros:

- can feel like a neutral local guide;
- can rank for broader city/event queries without over-branding the park;
- useful if Tyler/Longview domains already have or can build local authority.

Cons:

- booking conversion path must be carefully designed;
- authority may split across domains;
- more maintenance and canonicalization risk.

#### Option C — Hub-and-spoke, recommended long-term

Use Shallow Creek as the commercial conversion hub and optionally use `tyler-tx.net` / `longview-tx.net` as local editorial/event spokes.

Example:

- `shallowcreekrv.com/events/` — RV-trip-focused event pages and booking CTA.
- `longview-tx.net/events/` — broader Longview events authority surface.
- `tyler-tx.net/events/` — broader Tyler events authority surface.
- Shared canonical event API/data backend.
- Carefully avoid duplicate pages by assigning each event/page a canonical owner.

Recommended MVP: **start with Option A or a limited Option C**. Build the data model once, publish the first high-quality pages on the rebuilt Astro Shallow Creek site, then expand to city domains after proving crawl/index/conversion value.

---

## 3. Confirmed user inputs

- Project type: **spec/plan first**.
- Primary surface: **public website feature**.
- Tech direction: **Astro/static + serverless API**.
- Park origin point: `32.4550931184018, -94.93548062084842`.
- Radius tiers:
  - **15 miles** — nearby / immediate local.
  - **50 miles** — day-trip range.
- Target region/entities:
  - East Texas;
  - Longview;
  - Tyler;
  - Kilgore;
  - Gladewater;
  - Marshall.
- Event sources expected:
  - city event calendars;
  - Facebook Events;
  - Eventbrite;
  - city newspaper websites;
  - comprehensive source URL list coming later.
- Scrapers are acceptable.
- Initial update frequency: **daily**.
- Moderation: **AI moderation agent acceptable**.
- Current website: exists, being rebuilt as **static Astro**.
- Indexing strategy: start with **high-quality events**, possibly expand to every event later.
- Voice: **travel concierge**.
- Canonical model: **custom internal canonical model with JSON-LD projection to schema.org/Event**.
- Public API stance: make it whatever maximizes authority for humans and AI.
- Agent-first requirement: design the API/tooling so agents find it intuitive, deterministic, and self-describing.
- RAG/agent fields: yes.
- Ticketing means: **event admission / ticket purchase info**, not support tickets.
- Support/operations tickets: internal only.

---

## 4. Product surfaces

The system should ship as four synchronized surfaces.

### 4.1 Human website pages

Primary surface. These should be fast, static or incrementally generated Astro pages.

MVP pages:

- `/events/` — East Texas events near Shallow Creek.
- `/events/this-weekend/` — high-intent travel query page.
- `/events/near-shallow-creek-rv-park/` — exact park intent page.
- `/events/longview-tx/`
- `/events/tyler-tx/`
- `/events/kilgore-tx/`
- `/events/gladewater-tx/`
- `/events/marshall-tx/`
- `/events/family-friendly/`
- `/events/live-music/`
- `/events/festivals/`
- `/events/outdoor/`
- `/events/free/`
- `/events/{event-slug}/` — only for curated/high-quality events at MVP.

Important: event detail pages should include a clear lodging CTA, e.g.

> Coming to East Texas for this event? Shallow Creek RV Park is X miles away and is a quiet basecamp for the weekend.

### 4.2 Public JSON API

A small read-only API optimized for agents and static site generation.

MVP endpoints:

```http
GET /api/events
GET /api/events/{id}
GET /api/sources
GET /api/meta
```

Optional convenience endpoints:

```http
GET /events.json
GET /events.ics
GET /events.rss.xml
GET /api/events/this-weekend
GET /api/events/nearby
```

### 4.3 Structured data / JSON-LD

Every event detail page should project the internal canonical event model into `schema.org/Event` JSON-LD, rendered in initial HTML.

Event list pages should use `ItemList` and link to individual event pages.

Shallow Creek pages should use appropriate local business/lodging schema, likely one or more of:

- `LodgingBusiness`
- `Campground`
- `LocalBusiness`
- `Place`

Structured data must mirror visible page content. Do not add ticket prices, ratings, claims, or organizer data to JSON-LD unless users can see equivalent information on the page.

### 4.4 Agent discovery surface

Recommended eventually:

```http
GET /.well-known/ai-plugin.json       # optional; only if useful for agent ecosystems
GET /openapi.json                     # strongly recommended
GET /llms.txt                         # optional navigation aid, not a ranking lever
GET /api/meta                         # data freshness, coverage, source count, endpoint hints
```

`openapi.json` is more important than `llms.txt` for agents because it gives deterministic tool shapes.

---

## 5. Agent-first design principles

The API and tooling should be designed like an ergonomic agent tool.

### 5.1 Deterministic by default

- Stable event IDs.
- Stable slugs.
- Stable enum values.
- Same shape on list and detail responses, with detail-only expansions clearly documented.
- Vendor/source IDs never used as canonical public IDs; store them under `source.source_event_id`.

### 5.2 Self-describing

Every response should include enough context that an agent can explain what it found:

- origin point;
- radius tier;
- filters applied;
- generated timestamp;
- source timestamp;
- confidence score;
- moderation status;
- known caveats.

### 5.3 Machine-actionable errors

Bad requests should return errors that help an agent correct itself.

Example:

```json
{
  "error": {
    "code": "INVALID_RADIUS_TIER",
    "message": "radius_tier must be one of: 15, 50",
    "hint": "Use radius_tier=50 for day-trip events near Shallow Creek RV Park.",
    "docs_url": "https://example.com/api/docs#radius_tier"
  }
}
```

### 5.4 Agent-readable metadata

`GET /api/meta` should return:

```json
{
  "name": "East Texas Events API",
  "sponsor": "Shallow Creek RV Park",
  "origin": {
    "name": "Shallow Creek RV Park",
    "latitude": 32.4550931184018,
    "longitude": -94.93548062084842
  },
  "coverage": {
    "radius_tiers_miles": [15, 50],
    "regions": ["East Texas", "Longview", "Tyler", "Kilgore", "Gladewater", "Marshall"]
  },
  "freshness": {
    "update_frequency": "daily",
    "last_generated_at": "2026-05-10T00:00:00Z"
  },
  "formats": ["html", "json", "json-ld", "rss", "ics"],
  "openapi_url": "/openapi.json"
}
```

### 5.5 Explainable ranking

If the API sorts by relevance, expose why.

Example:

```json
"relevance": {
  "score": 0.86,
  "reasons": [
    "within 15 miles of Shallow Creek",
    "family-friendly",
    "weekend date",
    "official city calendar source"
  ]
}
```

### 5.6 Human-compatible, not just robot-compatible

Agents are more likely to cite and recommend sources that are also good human pages. The website should have visible summaries, source links, update timestamps, and travel notes.

---

## 6. Canonical event model

The internal model should be custom, then projected into API responses, Astro pages, JSON-LD, RSS, and ICS.

### 6.1 Event object

```json
{
  "id": "evt_01HZXEXAMPLE0001",
  "slug": "red-river-music-festival-2026-04-12",
  "title": "Red River Music Festival",
  "description": "Annual outdoor festival featuring regional bands, food trucks, and kids' activities.",
  "agent_summary": "A family-friendly outdoor music festival within day-trip range of Shallow Creek RV Park, with food trucks and regional bands.",
  "why_go": "Good fit for RV travelers looking for a weekend East Texas music event with outdoor activities.",

  "start_at": "2026-04-12T17:00:00-05:00",
  "end_at": "2026-04-12T23:30:00-05:00",
  "timezone": "America/Chicago",
  "all_day": false,
  "status": "scheduled",

  "location": {
    "name": "Red River Fairgrounds",
    "address1": "123 Fairground Rd",
    "address2": null,
    "city": "Longview",
    "region": "TX",
    "postal_code": "75601",
    "country": "US",
    "latitude": 32.5007,
    "longitude": -94.7405
  },

  "geo": {
    "distance_from_park_miles": 42.3,
    "radius_tier": 50,
    "estimated_drive_time_minutes": 52,
    "route_note": "Best treated as a day-trip event from Shallow Creek."
  },

  "organizer": {
    "name": "Red River Events LLC",
    "email": null,
    "phone": null,
    "url": "https://redriverevents.com"
  },

  "links": {
    "web_url": "https://redriverevents.com/musicfest",
    "source_url": "https://city.example/events/red-river-music-festival",
    "tickets_url": "https://tickets.example/red-river-music-festival",
    "calendar_url": null
  },

  "admission": {
    "is_free": false,
    "requires_ticket": true,
    "registration_required": false,
    "price_min": 25,
    "price_max": 60,
    "currency": "USD",
    "availability": "unknown",
    "purchase_url": "https://tickets.example/red-river-music-festival",
    "age_restrictions": null,
    "refund_policy_url": null
  },

  "categories": ["music", "festival", "outdoor"],
  "tags": ["family-friendly", "food-trucks", "weekend"],

  "rv_context": {
    "family_friendly": true,
    "pet_friendly": null,
    "outdoor": true,
    "rainy_day_friendly": false,
    "senior_friendly": true,
    "rv_parking_notes": "Check venue parking rules before arrival; park your RV at Shallow Creek and drive a tow vehicle if possible.",
    "ideal_stay_length_days": 2,
    "booking_prompt": "Book a weekend RV site at Shallow Creek and use it as your East Texas basecamp for this event."
  },

  "relevance": {
    "score": 0.86,
    "score_version": "2026-05-10-v1",
    "reasons": [
      "within 50 miles",
      "weekend event",
      "family-friendly",
      "official or semi-official source"
    ]
  },

  "source": {
    "name": "Longview City Events Calendar",
    "type": "city_calendar",
    "source_event_id": "abc-123",
    "source_url": "https://city.example/events/abc-123",
    "first_seen_at": "2026-02-20T18:10:00Z",
    "last_seen_at": "2026-02-23T18:10:00Z",
    "confidence": 0.92
  },

  "moderation": {
    "status": "approved",
    "reviewed_by": "ai",
    "reviewed_at": "2026-02-23T18:15:00Z",
    "risk_flags": []
  },

  "created_at": "2026-02-20T18:10:00Z",
  "updated_at": "2026-02-23T18:15:00Z"
}
```

### 6.2 Event status enum

Use a small normalized enum:

- `scheduled`
- `cancelled`
- `postponed`
- `tentative`
- `past`

### 6.3 Admission availability enum

- `available`
- `sold_out`
- `cancelled`
- `unknown`
- `not_applicable`

### 6.4 Radius tier enum

- `15`
- `50`

Avoid arbitrary public `radius=150` for MVP. Arbitrary radius filters are useful later, but fixed tiers produce cleaner pages, fewer thin combinations, and better static generation.

---

## 7. Public API design

Base URL to be decided depending on brand architecture.

Potential base URLs:

- `https://www.shallowcreekrv.com/api`
- `https://events.shallowcreekrv.com/api`
- `https://longview-tx.net/api`
- `https://tyler-tx.net/api`

### 7.1 List events

```http
GET /api/events
```

Query parameters:

| Param | Type | Notes |
|---|---:|---|
| `from` | date | ISO date, default today |
| `to` | date | ISO date, default +30 days |
| `radius_tier` | enum | `15` or `50` |
| `city` | string | Longview, Tyler, Kilgore, Gladewater, Marshall |
| `category` | string | music, festival, outdoor, family, sports, market, etc. |
| `tag` | string | flexible tag filter |
| `q` | string | text search |
| `family_friendly` | boolean | optional |
| `pet_friendly` | boolean | optional |
| `free` | boolean | optional |
| `requires_ticket` | boolean | optional |
| `sort` | enum | `start_at`, `distance`, `relevance`, `updated_at` |
| `limit` | number | default 25, max 100 |
| `cursor` | string | cursor pagination |
| `format` | enum | `summary` or `full` |

Response:

```json
{
  "meta": {
    "generated_at": "2026-05-10T12:00:00Z",
    "origin": {
      "name": "Shallow Creek RV Park",
      "latitude": 32.4550931184018,
      "longitude": -94.93548062084842
    },
    "filters": {
      "from": "2026-05-10",
      "to": "2026-06-10",
      "radius_tier": 50,
      "city": null,
      "category": null
    },
    "count": 25,
    "next_cursor": "eyJzdGFydF9hdCI6Ii4uLiJ9",
    "docs_url": "/api/docs"
  },
  "data": []
}
```

### 7.2 Get event detail

```http
GET /api/events/{id}
```

Returns the full canonical event object plus JSON-LD projection if requested.

Optional:

```http
GET /api/events/{id}?include=jsonld
```

### 7.3 API metadata

```http
GET /api/meta
```

Purpose: help agents understand what the dataset covers and how fresh it is.

### 7.4 Sources

```http
GET /api/sources
GET /api/sources/{id}
```

Source object:

```json
{
  "id": "src_longview_city_calendar",
  "name": "Longview City Events Calendar",
  "type": "city_calendar",
  "url": "https://...",
  "region": "Longview",
  "ingestion_method": "scrape|ics|rss|api|manual",
  "update_frequency": "daily",
  "last_checked_at": "2026-05-10T12:00:00Z",
  "status": "active",
  "trust_score": 0.9
}
```

---

## 8. Website page strategy

### 8.1 MVP indexable page set

Start high-quality and avoid scaled-content risk. Publish only pages with enough events, useful visible copy, and a clear reason to exist.

Recommended MVP:

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
12. curated event detail pages only.

### 8.2 Page template requirements

Every page should include:

- H1 matching search intent;
- concise travel-concierge intro;
- visible last-updated date;
- event cards with time, place, distance, city, category, ticket status;
- links to source pages;
- “Stay at Shallow Creek” CTA;
- internal links to city/category/weekend pages;
- JSON-LD in initial HTML;
- static fallback content if API hydration fails.

### 8.3 Example page positioning

`/events/this-weekend/`

H1:

> East Texas Events This Weekend Near Shallow Creek RV Park

Intro:

> Planning an RV weekend in East Texas? Here are curated events within day-trip range of Shallow Creek RV Park, including Longview, Tyler, Kilgore, Gladewater, and Marshall. We update this list daily and include distance, ticket notes, and family-friendly context where available.

CTA:

> Need a quiet basecamp for the weekend? Check RV site availability at Shallow Creek.

---

## 9. AEO / AI visibility strategy

### 9.1 What makes this cite-worthy

The site should become a better answer source than generic event sites because it has:

- East Texas-specific coverage;
- daily freshness;
- source attribution;
- distance from Shallow Creek;
- drive-time / travel-planning context;
- admission/ticket data;
- human-readable local guidance;
- clean structured data;
- accessible JSON and OpenAPI surfaces.

### 9.2 Initial HTML contract

Important content must be present in raw HTML, not only client-side JavaScript:

- event title;
- date/time;
- location/city;
- distance tier;
- source link;
- short summary;
- ticket/admission notes;
- booking CTA.

Astro/static is a strong fit because it can generate crawlable pages with minimal JS.

### 9.3 Query fan-out coverage

For a query like:

> events near Shallow Creek RV Park this weekend

An answer engine may fan out to:

- East Texas events this weekend;
- Longview events this weekend;
- Tyler events this weekend;
- family-friendly events near Longview;
- RV parks near Longview events;
- ticketed festivals near East Texas.

The site should have pages and internal links that cover these proof paths.

### 9.4 Citation-ready passages

Every major page should include a short self-contained passage that can be quoted by AI systems.

Example:

> Shallow Creek RV Park tracks East Texas events within 15-mile and 50-mile trip ranges from the park’s location at 32.455093, -94.935481. The guide is updated daily and covers Longview, Tyler, Kilgore, Gladewater, Marshall, and nearby communities. Each curated event includes date, venue, distance from the park, source attribution, and ticket/admission notes when available.

This passage has specific data, region entities, update cadence, and what the dataset contains.

---

## 10. Ingestion pipeline

### 10.1 Source types

Initial source types:

- `city_calendar`
- `facebook_events`
- `eventbrite`
- `newspaper`
- `tourism_board`
- `venue_site`
- `manual`

### 10.2 Pipeline stages

1. **Fetch**
   - API, RSS, ICS, HTML scrape, or manual source.
2. **Extract**
   - raw event candidates with source URL and extracted fields.
3. **Normalize**
   - map to canonical event model.
4. **Geocode**
   - venue address to lat/lon.
5. **Deduplicate**
   - merge same event across multiple sources.
6. **Enrich**
   - category, tags, RV context, ticket/admission details, agent summary.
7. **Moderate**
   - AI approval/rejection with flags and confidence.
8. **Publish**
   - static pages, JSON API data, RSS/ICS, sitemap updates.
9. **Monitor**
   - source health, stale events, broken links, duplicate spikes.

### 10.3 Daily cadence

MVP schedule:

- run ingestion daily overnight;
- generate moderation queue;
- auto-publish high-confidence approved events;
- flag low-confidence or risky events for human review;
- rebuild static site or data files after approval.

### 10.4 AI moderation rules

Auto-approve only when:

- date/time is clear;
- location is within target tiers or target cities;
- source is trusted;
- event is public;
- event is not adult-only unless intentionally allowed and labeled;
- ticket/admission claims are sourced;
- duplicate check passes.

Flag for review when:

- date/time conflict across sources;
- location cannot be geocoded;
- event appears cancelled/postponed;
- source has low trust;
- description contains sensitive/adult/political/medical claims;
- price/availability claims are uncertain.

---

## 11. Storage and build architecture

### 11.1 Recommended MVP stack

Given Astro/static + serverless API direction:

- **Astro** for public pages.
- **Static JSON files** for MVP API if event count is small/moderate.
- **Serverless functions** for filtered API responses if dynamic filtering is needed.
- **SQLite or Postgres/Supabase** for ingestion/admin pipeline depending on complexity.
- **Object storage / repo data files** for generated public snapshots.

### 11.2 Practical architecture options

#### Option A — Static-first MVP

- Ingestion job writes normalized data to `events.json`.
- Astro generates pages from `events.json`.
- `/events.json`, `/events.rss.xml`, `/events.ics` are static outputs.
- Search/filter is handled at build time through prebuilt pages and light client-side filtering.

Best for: fastest MVP, cheapest hosting, strongest crawlability.

#### Option B — Static site + serverless API

- Database stores canonical events.
- Astro builds high-value pages.
- Serverless API handles `/api/events` filters.
- Static JSON snapshots remain available for agents.

Best for: richer API and source/admin workflows.

#### Option C — Full database-backed app

Probably not needed for MVP unless moderation/admin needs are complex.

### 11.3 Recommendation

Start with **Option B-lite**:

- canonical data in SQLite/Postgres;
- daily ingest job;
- generated static JSON snapshots;
- Astro static pages;
- minimal serverless endpoints for dynamic API queries.

---

## 12. JSON-LD projection

Internal event fields should map to `schema.org/Event`.

Example:

```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Red River Music Festival",
  "description": "Annual outdoor festival featuring regional bands, food trucks, and kids' activities.",
  "startDate": "2026-04-12T17:00:00-05:00",
  "endDate": "2026-04-12T23:30:00-05:00",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": "Red River Fairgrounds",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Fairground Rd",
      "addressLocality": "Longview",
      "addressRegion": "TX",
      "postalCode": "75601",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 32.5007,
      "longitude": -94.7405
    }
  },
  "organizer": {
    "@type": "Organization",
    "name": "Red River Events LLC",
    "url": "https://redriverevents.com"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://tickets.example/red-river-music-festival",
    "price": "25",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  },
  "url": "https://www.shallowcreekrv.com/events/red-river-music-festival-2026-04-12/"
}
```

Rules:

- Only include `offers` if ticket/admission info is visible on the page.
- Do not invent prices.
- Use source links and visible “last updated” notes.
- Keep JSON-LD server-rendered in initial HTML.

---

## 13. Source authority and data quality

### 13.1 Source trust score

Each source should have a `trust_score` from 0 to 1.

Initial heuristic:

| Source type | Starting trust |
|---|---:|
| Official city calendar | 0.95 |
| Tourism board | 0.90 |
| Official venue site | 0.85 |
| Eventbrite organizer page | 0.80 |
| Newspaper event listing | 0.75 |
| Facebook event | 0.65 |
| Unknown scraped page | 0.40 |

### 13.2 Event confidence score

Event confidence should combine:

- source trust;
- completeness of title/date/location;
- geocode confidence;
- duplicate/source corroboration;
- recency of last seen;
- moderation result.

### 13.3 Deduplication keys

Potential dedupe signals:

- normalized title;
- date/time overlap;
- venue name;
- city;
- organizer;
- source links;
- fuzzy text similarity.

Keep `source_records[]` internally so one canonical event can preserve multiple sources.

---

## 14. MVP roadmap

### Phase 0 — Finalize source list and brand decision

Inputs needed:

- final website/domain decision;
- source URL list;
- current Astro repo path;
- hosting target;
- analytics/Search Console access if available.

Deliverables:

- source inventory CSV;
- domain/canonical strategy;
- final MVP page list.

### Phase 1 — Data model and static prototype

Build:

- canonical event schema;
- sample event dataset;
- JSON feed;
- Astro event list page;
- one event detail page;
- JSON-LD projection;
- `openapi.json` draft.

Acceptance criteria:

- pages render without client JS;
- JSON-LD validates syntactically;
- API examples are stable and documented;
- event pages include booking CTA.

### Phase 2 — Ingestion MVP

Build:

- source adapter interface;
- 2–3 pilot source adapters;
- daily job;
- dedupe pass;
- geocoding;
- moderation queue.

Acceptance criteria:

- daily run produces normalized events;
- failures are logged per source;
- rejected/flagged events are explainable.

### Phase 3 — AEO content launch

Build:

- MVP event pages;
- city/category/weekend pages;
- sitemap updates;
- RSS/ICS/JSON feeds;
- visible source/freshness notes;
- AI-citation-ready passages.

Acceptance criteria:

- high-quality pages indexed;
- Search Console sees sitemap;
- pages have static HTML content;
- event pages and list pages include structured data.

### Phase 4 — Measurement and expansion

Build:

- GA4 or Plausible events;
- booking CTA tracking;
- Search Console query monitoring;
- AI citation tracking sheet;
- source coverage expansion.

Acceptance criteria:

- can report organic traffic to event pages;
- can report booking CTA clicks;
- can identify which cities/categories are gaining impressions.

---

## 15. Analytics and success metrics

### 15.1 Business metrics

- Event page sessions.
- Event page → booking CTA clicks.
- Booking inquiry / reservation starts from event pages.
- Assisted bookings from event landing pages.

### 15.2 Search metrics

- Indexed event pages.
- Impressions for “events near…” queries.
- Impressions for city + event/category queries.
- CTR by page type.
- Average position by city/category/weekend cluster.

### 15.3 AI visibility metrics

Track manually/semi-manually at first:

- Query: “events near Shallow Creek RV Park this weekend”
- Query: “family friendly events near Longview TX this weekend”
- Query: “things to do near Shallow Creek RV Park”
- Query: “East Texas festivals this weekend”
- Query: “RV park near Longview events”

For each query, track whether Shallow Creek or the events property is cited/mentioned by:

- Google AI Overview / AI Mode;
- ChatGPT browsing;
- Perplexity;
- Claude search if available.

### 15.4 Data quality metrics

- Events ingested per source.
- Percent auto-approved.
- Duplicate rate.
- Broken source rate.
- Events with complete date/time/location.
- Events with ticket/admission data.
- Events with RV context.

---

## 16. Open questions / decisions still needed

1. Final public domain strategy:
   - Shallow Creek only?
   - standalone sponsored site?
   - `tyler-tx.net` and `longview-tx.net` as city spokes?
2. Exact Shallow Creek production domain and rebuilt Astro repo path.
3. Hosting target:
   - Cloudflare Pages/Workers?
   - Netlify?
   - Vercel?
   - other?
4. Initial source URL list and source priority ranking.
5. Human review requirements for AI moderation.
6. Whether event detail pages should be generated for all approved events or only curated events after MVP.
7. Whether to use a database immediately or start with generated JSON files.
8. Whether city-domain pages should cross-link/canonicalize to Shallow Creek or maintain separate canonical pages.

---

## 17. Recommended immediate next steps

1. **Collect source URLs** in a structured sheet with columns:
   - name;
   - URL;
   - city/region;
   - source type;
   - expected update frequency;
   - notes;
   - priority.
2. **Choose MVP domain strategy** for launch.
3. **Identify Astro repo path** so implementation planning can match the real codebase.
4. Build a **sample event dataset** of 20–50 events manually or semi-manually.
5. Prototype:
   - `/events/`;
   - `/events/this-weekend/`;
   - `/api/events`;
   - `/events.json`;
   - one JSON-LD event detail page.
6. Validate crawlability and structured data before scaling page count.

---

## 18. Principle to keep us honest

Do not build a generic event directory. Build the most useful East Texas event planning layer for RV travelers.

If a field helps an agent answer “Should I stay at Shallow Creek for this trip?” then it belongs in the model.

If a page helps a human plan a weekend and gives an AI system specific, sourced, crawlable facts to cite, then it belongs on the website.

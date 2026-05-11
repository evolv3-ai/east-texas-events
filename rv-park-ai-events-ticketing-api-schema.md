---
title: "Universal Events + Ticketing Schema for an AI-Friendly RV Park API"
date: "2026-02-23"
project: "Shallow Creek RV"
---

## Why your CSVs are a gift

The two CSVs you provided are *field-compatibility matrices* (what major vendors support), not raw event/ticket records.
That’s useful because it lets us derive a **de facto “universal” schema** based on what’s most consistently supported across:

- **Calendars**: Google Calendar, Outlook, Zoom, Calendly, HubSpot, Salesforce, etc.
- **Ticketing/Helpdesk**: Zendesk, Freshdesk, HubSpot, Intercom, ServiceNow, Gorgias, Jira Service Management, etc.

For an API meant to be attractive to AI agents, “universal + predictable” beats “clever”.

---

## What “AI-attractive” means in practice

Agents do best when the API is:

- **Deterministic**: stable IDs, stable field names, consistent types
- **Filterable**: geo/time/category filters, clear pagination
- **Self-describing**: explicit timezone, ISO-8601 timestamps, status enums
- **Composable**: nested objects with predictable shapes (location, organizer, tags, links)
- **Attribution-friendly**: `source`, `source_url`, `last_seen_at`, `confidence`

---

# Part A — Events (things to do within 150 miles)

## Field universality (from `unified_calendar_readableFields.csv`)

This file has **27 providers**. Counts below show how many providers support the field.

### Top calendar/event fields by support

| Property                      |   supported_count | supported_pct   |
|:------------------------------|------------------:|:----------------|
| calendar_calendar_id          |                22 | 81%             |
| calendar_calendar_name        |                22 | 81%             |
| calendar_event_attendees      |                22 | 81%             |
| calendar_event_end_at         |                22 | 81%             |
| calendar_event_id             |                22 | 81%             |
| calendar_event_start_at       |                22 | 81%             |
| calendar_event_subject        |                22 | 81%             |
| calendar_event_organizer      |                21 | 78%             |
| calendar_event_created_at     |                17 | 63%             |
| calendar_event_notes          |                16 | 59%             |
| calendar_event_location       |                14 | 52%             |
| calendar_event_web_url        |                14 | 52%             |
| calendar_event_timezone       |                13 | 48%             |
| calendar_event_status         |                12 | 44%             |
| calendar_event_updated_at     |                12 | 44%             |
| calendar_event_recurrence     |                11 | 41%             |
| calendar_recording_end_at     |                11 | 41%             |
| calendar_recording_id         |                11 | 41%             |
| calendar_recording_media      |                11 | 41%             |
| calendar_recording_start_at   |                11 | 41%             |
| calendar_event_calendar_id    |                10 | 37%             |
| calendar_event_conference     |                10 | 37%             |
| calendar_event_is_private     |                10 | 37%             |
| calendar_calendar_description |                 9 | 33%             |
| calendar_event_is_all_day     |                 9 | 33%             |
| calendar_event_is_free        |                 9 | 33%             |
| calendar_link_id              |                 9 | 33%             |
| calendar_link_name            |                 9 | 33%             |
| calendar_link_url             |                 9 | 33%             |
| calendar_link_description     |                 8 | 30%             |

**Interpretation**
- The “Tier 1” minimum viable event schema is extremely clear:
  `id`, `title`, `start_at`, `end_at`, `attendees`, plus the parent calendar identity.
- The next most universal fields add the things agents need to reason and act:
  organizer, notes/description, web URL, location, timezone, status, updated timestamps.
- A meaningful chunk of platforms support **recurrence** and **conference** details.

---

## Recommended canonical event model (AI-first)

### `Event` object (canonical)

```json
{
  "id": "evt_01J0Z8QJ5A8P7C3NQ0E6H9W2KX",
  "title": "Red River Music Festival",
  "description": "Annual outdoor festival featuring regional bands, food trucks, and kids' activities.",
  "start_at": "2026-04-12T17:00:00-05:00",
  "end_at": "2026-04-12T23:30:00-05:00",
  "timezone": "America/Chicago",
  "status": "scheduled",
  "all_day": false,
  "is_private": false,

  "location": {
    "name": "Red River Fairgrounds",
    "address1": "123 Fairground Rd",
    "city": "Longview",
    "region": "TX",
    "postal_code": "75601",
    "country": "US",
    "latitude": 32.5007,
    "longitude": -94.7405
  },

  "organizer": {
    "name": "Red River Events LLC",
    "email": "info@example.com",
    "phone": null,
    "url": "https://redriverevents.com"
  },

  "links": {
    "web_url": "https://redriverevents.com/musicfest",
    "calendar_url": null,
    "tickets_url": null
  },

  "categories": ["music", "festival", "outdoor"],
  "tags": ["family-friendly", "food-trucks"],

  "distance_from_park_miles": 42.3,
  "source": {
    "name": "Longview City Events Feed",
    "type": "ics|rss|html|api|manual",
    "source_id": "abc-123",
    "source_url": "https://example.com/events/abc-123",
    "last_seen_at": "2026-02-23T18:10:00Z",
    "confidence": 0.86
  },

  "created_at": "2026-01-10T12:44:00Z",
  "updated_at": "2026-02-20T09:10:00Z"
}
```

### Why this shape works

- Matches the **most universal** calendar fields (title/subject, start/end, organizer, location, web URL).
- Adds RV-park-specific derived fields that agents *love*:
  `distance_from_park_miles`, category/tag buckets, and provenance/confidence.

---

## Suggested Events API endpoints

### Search
- `GET /events?radius_miles=150&from=2026-04-01&to=2026-04-30`
- Optional filters:
  - `q=` (full-text search)
  - `category=` / `tag=`
  - `city=` / `region=`
  - `lat=` + `lon=` (override origin)
  - `sort=start_at|distance|relevance`
  - `limit=` / `cursor=`

### Detail
- `GET /events/{id}`

### Optional: sources
- `GET /sources`
- `GET /sources/{id}/events`

### Response pattern
Return a single predictable envelope:

```json
{
  "meta": {
    "generated_at": "2026-02-23T20:55:00Z",
    "radius_miles": 150,
    "from": "2026-04-01",
    "to": "2026-04-30",
    "next_cursor": "eyJwYWdlIjoyfQ=="
  },
  "data": [ /* events */ ]
}
```

---

# Part B — Ticketing (guest/support/operations tickets)

## Field universality (from `unified_ticketing_readableFields.csv`)

This file has **7 providers**. Counts below show how many providers support the field.

### Top ticketing fields by support

| Property                       |   supported_count | supported_pct   |
|:-------------------------------|------------------:|:----------------|
| ticketing_ticket_created_at    |                 7 | 100%            |
| ticketing_ticket_customer_id   |                 7 | 100%            |
| ticketing_ticket_id            |                 7 | 100%            |
| ticketing_ticket_status        |                 7 | 100%            |
| ticketing_ticket_subject       |                 7 | 100%            |
| ticketing_ticket_updated_at    |                 7 | 100%            |
| ticketing_ticket_url           |                 7 | 100%            |
| ticketing_customer_emails      |                 6 | 86%             |
| ticketing_customer_id          |                 6 | 86%             |
| ticketing_customer_name        |                 6 | 86%             |
| ticketing_note_created_at      |                 6 | 86%             |
| ticketing_note_description     |                 6 | 86%             |
| ticketing_note_id              |                 6 | 86%             |
| ticketing_ticket_closed_at     |                 6 | 86%             |
| ticketing_ticket_description   |                 6 | 86%             |
| ticketing_customer_created_at  |                 5 | 71%             |
| ticketing_customer_updated_at  |                 5 | 71%             |
| ticketing_note_user_id         |                 5 | 71%             |
| ticketing_ticket_tags          |                 5 | 71%             |
| ticketing_customer_telephones  |                 4 | 57%             |
| ticketing_note_customer_id     |                 4 | 57%             |
| ticketing_note_ticket_id       |                 4 | 57%             |
| ticketing_ticket_category_id   |                 4 | 57%             |
| ticketing_ticket_priority      |                 4 | 57%             |
| ticketing_ticket_user_id       |                 4 | 57%             |
| ticketing_note_updated_at      |                 3 | 43%             |
| ticketing_ticket_source        |                 3 | 43%             |
| ticketing_category_description |                 2 | 29%             |
| ticketing_category_id          |                 2 | 29%             |
| ticketing_category_name        |                 2 | 29%             |

**Interpretation**
- “Ticket” has a very stable universal core: `id`, `subject`, `status`, timestamps, and a canonical `url`.
- Most platforms also support:
  - `customer` identity (id/name/emails/phones)
  - `description` and threaded notes/comments
  - `priority`, `tags`, `category`, and `source/channel`

---

## Recommended canonical ticket model (AI-first)

### `Ticket` object (canonical)

```json
{
  "id": "tkt_01J0Z91B2WZKZ3S8X2KQ0E1TQK",
  "subject": "Water pedestal at Site 14 is leaking",
  "description": "Guest reports steady leak at the base of the pedestal. Started this morning.",
  "status": "open",
  "priority": "high",
  "tags": ["maintenance", "water", "site-14"],
  "category": {
    "id": "cat_maintenance",
    "name": "Maintenance"
  },
  "source": "sms|email|phone|walkup|app|agent",
  "url": "https://helpdesk.example.com/tickets/123",

  "customer": {
    "id": "cus_01J0Z8ZK1F3P4M2K9XH8A3D7Q1",
    "name": "Jane Doe",
    "emails": ["jane@example.com"],
    "telephones": ["+1-903-555-0123"]
  },

  "assignee": {
    "id": "usr_mike",
    "name": "Mike",
    "email": "mike@park.example"
  },

  "related": {
    "reservation_id": "res_01J0Z8...",
    "site_id": "site_14",
    "event_id": null
  },

  "created_at": "2026-02-23T14:05:00-06:00",
  "updated_at": "2026-02-23T15:22:00-06:00",
  "closed_at": null,

  "notes": [
    {
      "id": "note_01J0Z92A...",
      "created_at": "2026-02-23T14:10:00-06:00",
      "updated_at": "2026-02-23T14:10:00-06:00",
      "user_id": "usr_mike",
      "customer_id": null,
      "description": "Assigned to maintenance. ETA 30 minutes."
    }
  ]
}
```

### Why this shape works

- Aligns to the most universal ticket fields: `id`, `subject`, `status`, `created_at`, `updated_at`, `url`
- Keeps a predictable place for threaded conversation (`notes[]`)
- Adds RV-park operations linkage (`reservation_id`, `site_id`) so agents can act

---

## Suggested Ticketing API endpoints

- `GET /tickets?status=open&priority=high&site_id=site_14`
- `GET /tickets/{id}`
- `POST /tickets` (create)
- `PATCH /tickets/{id}` (status/assignment/tags)
- `POST /tickets/{id}/notes` (add comment)

> If you plan to expose write endpoints to agents, strongly consider an **“actions” layer** with guardrails, e.g. `POST /tickets/{id}/actions/close` so you can validate intent.

---

# Joining Events + Ticketing: what to expose to agents

## Option 1: Separate resources (recommended)
- `/events` for things to do
- `/tickets` for guest/support work

Agents can use both, and you avoid confusing “event ticket sales” with “support tickets”.

## Option 2: Unified “activity feed”
- `GET /activity?from=...&to=...`
- returns mixed items with a shared envelope:
  - `type: "event" | "ticket"`
  - `data: {...}`

This is great for “what’s going on near the park + what needs attention at the park”.

---

# Implementation details that matter for agents

## IDs
Use globally unique string IDs (ULID/UUID). Don’t reuse vendor IDs directly—store them under `source.source_id`.

## Timestamps
Use ISO-8601 with offset (or `Z`). Always include a separate `timezone` field for events.

## Pagination
Cursor-based pagination is easier for agents than page numbers.

## Status enums (keep them small)
- Event: `scheduled | cancelled | tentative | past`
- Ticket: `open | pending | solved | closed` (and map vendor-specific values internally)

## Provenance & confidence
This helps agents explain *why* they recommended an event.

---

# Minimal OpenAPI-ish shapes (starter)

## Event search response (shape)
```json
{
  "meta": {
    "next_cursor": "string|null"
  },
  "data": [
    {
      "id": "string",
      "title": "string",
      "start_at": "string",
      "end_at": "string",
      "timezone": "string",
      "location": {
        "name": "string|null",
        "latitude": "number|null",
        "longitude": "number|null"
      },
      "distance_from_park_miles": "number|null",
      "links": {
        "web_url": "string|null",
        "tickets_url": "string|null"
      }
    }
  ]
}
```

## Ticket create request (shape)
```json
{
  "subject": "string",
  "description": "string",
  "priority": "low|normal|high|urgent",
  "tags": ["string"],
  "source": "sms|email|phone|walkup|app|agent",
  "customer": {
    "name": "string|null",
    "email": "string|null",
    "telephone": "string|null"
  },
  "related": {
    "reservation_id": "string|null",
    "site_id": "string|null"
  }
}
```

---

# Next steps (fastest path)

1. **Confirm your park’s origin point** (lat/lon) for radius calculations.
2. Decide whether events are:
   - ingested from feeds (ICS/RSS/APIs), or
   - scraped from websites, or
   - both.
3. Pick your “canonical” schema from above and implement:
   - `GET /events` + `GET /events/{id}`
   - `GET /tickets` + `POST /tickets`
4. Add enrichment fields that make recommendations better:
   - `family_friendly`, `pet_friendly`, `outdoor`, `cost_estimate`, `rv_parking_notes`

---

## Appendix: Raw file paths analyzed

- `unified_calendar_readableFields.csv`
- `unified_ticketing_readableFields.csv`

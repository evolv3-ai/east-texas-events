# Design — JSON-LD status mapping + past-event filter

**Date:** 2026-06-08
**Author:** Claude (warmup change driven by user)
**Status:** Draft → Pending user review
**Closes:** Gap #1 (JSON-LD `eventStatus` incomplete) and Gap #4 (no unit tests) from `docs/status/reality-check-2026-06-08.md`. Opens behavior change for past events (newly decided).

## Problem

Two related defects in the events module:

1. **`src/lib/events/jsonld.ts:13`** — `eventStatus` is set by a binary ternary: `event.status === 'cancelled' ? 'EventCancelled' : 'EventScheduled'`. The internal schema (`src/lib/events/schema.ts:3`) admits 5 statuses (`scheduled`, `cancelled`, `postponed`, `tentative`, `past`). Three of those (`postponed`, `tentative`, `past`) fall through to `EventScheduled`. The `postponed` case is the only schema.org mismatch with a clean fix (`https://schema.org/EventPostponed`) — `tentative` and `past` have no direct schema.org equivalents.

2. **`src/lib/events/data.ts:4-9`** — `getApprovedEvents()` filters on `moderation.status === 'approved'` but never filters by event date. A build run after an event's `end_at` will continue to surface it on `/events/`, in `/events.json`, in the location landing page, etc., until someone manually flips `status` to `past` and re-builds. For a static site that rebuilds infrequently, past events linger on the home page.

## Goals

- JSON-LD `eventStatus` reflects the internal status accurately for every value the schema admits.
- Past events do not appear in any public surface — neither HTML pages nor `/events.json` nor JSON-LD.
- The filter is deterministic and testable: it depends only on `(event, now)`.
- Plant Vitest infrastructure so future pure-function changes can be TDD'd.

## Non-goals (YAGNI)

- No `/events/archive/` route for past events. (User explicitly declined.)
- No `EventRescheduled` or `EventMovedOnline` schema.org types — we don't track rescheduling or virtualization in our schema.
- No coverage reporting infrastructure (`@vitest/coverage-v8` etc.). Vitest alone, no plugins.
- No CI wiring. Local `npm run test` and `npm run build` only.
- No refactor of how `data.ts` consumes the seed JSON. (Could be injected for testability; current direct import is fine for warmup.)

## Decisions

| Decision | Choice | Why |
|---|---|---|
| `tentative` → schema.org status | `EventScheduled` | Schema.org has no `EventTentative`. `EventScheduled` is closest semantically ("it is on the calendar"). Tentativeness can be surfaced in our own `/events.json` via `event.status` for consumers who care. |
| `past` → schema.org status | `EventScheduled` (defensive only) | Filtered out at the data layer, so should never reach JSON-LD. The mapping exists for type safety. |
| Past-event filter timestamp | `end_at ?? start_at` | If operator sets `end_at`, use it (allows multi-day events to linger correctly). Otherwise fall back to `start_at`. Predictable, no time-zone gymnastics. |
| `now` injection | Optional parameter, defaults to `new Date()` | Lets tests pass fixed `now` for determinism; production callers in `src/pages/*` use the default. |
| Test file location | `src/lib/events/__tests__/*.test.ts` | Co-locates tests with source; matches common Node/TS conventions. Vitest default `include` glob picks them up. |
| `cancelled`/`postponed`/`tentative` events stay in feed | Yes | Users searching "is the balloon race cancelled?" need to find the listing. JSON-LD `eventStatus` communicates the state. |

## Architecture

### `src/lib/events/jsonld.ts`

Add a const map; replace the ternary.

```typescript
const statusToSchemaOrg: Record<CanonicalEvent['status'], string> = {
  scheduled: 'EventScheduled',
  cancelled: 'EventCancelled',
  postponed: 'EventPostponed',
  tentative: 'EventScheduled',
  past: 'EventScheduled',
};

// inside eventToJsonLd:
eventStatus: `https://schema.org/${statusToSchemaOrg[event.status]}`,
```

`Record<CanonicalEvent['status'], string>` makes TypeScript enforce that all 5 statuses are mapped; any future schema enum addition causes a type error here.

### `src/lib/events/data.ts`

Extract a pure helper `isPublishable` and make `now` injectable.

```typescript
export function isPublishable(event: CanonicalEvent, now: Date): boolean {
  if (event.moderation.status !== 'approved') return false;
  if (event.status === 'past') return false;
  const ends = new Date(event.end_at ?? event.start_at);
  return ends >= now;
}

export function getApprovedEvents(now: Date = new Date()): CanonicalEvent[] {
  return rawEvents
    .map((event) => eventSchema.parse(event))
    .filter((event) => isPublishable(event, now))
    .sort((a, b) => a.start_at.localeCompare(b.start_at));
}

export function getEventBySlug(slug: string, now: Date = new Date()): CanonicalEvent | undefined {
  return getApprovedEvents(now).find((event) => event.slug === slug);
}

export function getEventsFeed(now: Date = new Date()): PublicEventsFeed {
  const events = getApprovedEvents(now);
  // …rest unchanged…
  return publicEventsFeedSchema.parse({
    schema_version: 'events-feed.v0.1',
    generated_at: now.toISOString(),  // use injected now for determinism
    // …
  });
}
```

`generated_at` now reflects the injected `now` instead of an independent `new Date()` — keeps the feed timestamp consistent with the filter.

### Astro pages and endpoints

No changes. They call `getApprovedEvents()` / `getEventsFeed()` with no args and get current-time behavior.

### `package.json`

```json
{
  "scripts": {
    "build": "astro check && npm run validate:data && npm run test && astro build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^2.x"
  }
}
```

Tests gate the build. Failing tests = no production artifacts.

### `vitest.config.ts` (new)

```typescript
import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

Mirrors the `@` alias from `tsconfig.json` / `astro.config.mjs` so tests can use the same imports as source.

### `src/lib/events/__tests__/factories.ts` (new)

Minimal factory for hand-crafting `CanonicalEvent` instances in tests. Defaults satisfy `eventSchema.parse` so callers override only what the test cares about.

### `src/lib/events/__tests__/jsonld.test.ts` (new)

```typescript
describe('eventToJsonLd', () => {
  it.each([
    ['scheduled',  'https://schema.org/EventScheduled'],
    ['cancelled',  'https://schema.org/EventCancelled'],
    ['postponed',  'https://schema.org/EventPostponed'],
    ['tentative',  'https://schema.org/EventScheduled'],
    ['past',       'https://schema.org/EventScheduled'],
  ])('maps status=%s to %s', (status, expected) => {
    const jsonld = eventToJsonLd(makeEvent({ status }));
    expect(jsonld.eventStatus).toBe(expected);
  });
});
```

Against current code: row 3 (`postponed`) fails. After fix: all 5 pass.

### `src/lib/events/__tests__/data.test.ts` (new)

```typescript
describe('isPublishable', () => {
  const future = new Date('2099-12-31T00:00:00Z');
  const past = new Date('2000-01-01T00:00:00Z');
  const now = new Date('2026-06-08T12:00:00Z');

  it('publishes approved scheduled future events', () =>
    expect(isPublishable(makeEvent({ start_at: future.toISOString() }), now)).toBe(true));

  it('excludes pending-moderation events', () =>
    expect(isPublishable(makeEvent({ moderation: { status: 'pending' } }), now)).toBe(false));

  it('excludes status=past events even if dates are future', () =>
    expect(isPublishable(makeEvent({ status: 'past', start_at: future.toISOString() }), now)).toBe(false));

  it('excludes events whose end_at is before now', () =>
    expect(isPublishable(makeEvent({ start_at: past.toISOString(), end_at: past.toISOString() }), now)).toBe(false));

  it('uses start_at when end_at is absent', () =>
    expect(isPublishable(makeEvent({ start_at: past.toISOString(), end_at: undefined }), now)).toBe(false));

  it('keeps cancelled events visible', () =>
    expect(isPublishable(makeEvent({ status: 'cancelled', start_at: future.toISOString() }), now)).toBe(true));

  it('keeps postponed events visible', () =>
    expect(isPublishable(makeEvent({ status: 'postponed', start_at: future.toISOString() }), now)).toBe(true));
});

describe('getApprovedEvents', () => {
  it('returns events from the seed when now is well in the past', () => {
    expect(getApprovedEvents(new Date('2025-01-01T00:00:00Z')).length).toBeGreaterThan(0);
  });

  it('returns empty when now is well in the future', () => {
    expect(getApprovedEvents(new Date('2100-01-01T00:00:00Z'))).toHaveLength(0);
  });
});
```

Against current code: `getApprovedEvents` doesn't accept `now`, so TypeScript fails. After fix: all 9 tests pass.

## Public-surface impact

| Surface | Today's output | After this change |
|---|---|---|
| `/events/` (HTML index) | 3 events | 2 events (Back Porch seed drops; balloon race + Shakespeare remain) |
| `/events/[slug]/` (per-event HTML + JSON-LD) | 3 detail pages, all `EventScheduled` | 2 detail pages, all `EventScheduled` (no `postponed` in current seed) |
| `/events/near-shallow-creek-rv-park/` | 3 events | 2 events |
| `/events.json` | 3 events | 2 events |
| `/openapi.json` | Unchanged | Unchanged |
| `/llms.txt` | `Generated: <build-time>` | Same; uses injected `now` (the default `new Date()`) |

**Future correctness:** when the Great Texas Balloon Race ends (2026-06-21) and a build runs after that, it will no longer surface. Same for the Back Porch live music seed event (2026-05-15). Today, those would persist indefinitely.

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| One seed event (`back-porch-kilgore-live-music-seed`, end_at 2026-05-15) is in the past relative to today's build — the new filter will drop it | Acknowledged. Demonstrates the filter is working as intended. Operator can either re-date the seed entry or accept that it will only appear in past-dated builds. Separate concern, not blocking. |
| `getStaticPaths()` in `[slug].astro` calls `getApprovedEvents()` without `now`; uses build-time wall clock | Intended. Static-site rebuilds capture "now" at build time. Documented in this spec. |
| Vitest dep adds ~20 MB to node_modules | Acceptable cost for the testing foundation. Already justified by gap #4. |
| `now` parameter on previously parameterless functions is a minor API change | All call sites use the default; no external consumer exists yet. |

## Out of scope (followups)

- Backfill an `isPublishable`-style filter on `/openapi.json` schema description (it claims to list "approved" events; should clarify "approved + upcoming")
- Move `seed-fixture-verify-before-public-launch` flag enforcement into `validate-data.ts` (gap #3)
- Add `eventStatus` rendering to the per-event HTML page so the UI shows postponements/cancellations
- Refactor `data.ts` to accept events as a parameter instead of importing the seed directly (better testability for `getApprovedEvents`; not needed today since `isPublishable` is fully testable in isolation)

## Acceptance

This change is done when:

1. All Vitest tests pass: `npm run test` exits 0
2. Full build chain passes: `npm run build` exits 0
3. `dist/events.json` still parses against `publicEventsFeedSchema`
4. `dist/events/<slug>/index.html` JSON-LD `eventStatus` is the correct schema.org URL for every event that survives `isPublishable`
5. `dist/events.json` `event_count` reflects the post-filter count (expected 2 from the current seed)
6. GitNexus `detect_changes` confirms no symbols outside the planned files are touched

import type { CanonicalEvent } from '../schema';

export function makeEvent(overrides: Partial<CanonicalEvent> = {}): CanonicalEvent {
  return {
    id: 'evt_test',
    slug: 'evt-test',
    title: 'Test Event',
    agent_summary: 'A test event that exists solely for unit testing purposes.',
    best_for: [],
    trip_planning_notes: [],
    start_at: '2099-01-01T00:00:00-05:00',
    timezone: 'America/Chicago',
    status: 'scheduled',
    location: { city: 'Kilgore', region: 'TX', country: 'US' },
    geo: {},
    links: { source_url: 'https://example.com/' },
    admission: { availability: 'unknown', currency: 'USD' },
    categories: ['test'],
    tags: [],
    rv_context: {},
    relevance: { score: 100, score_version: 'test', reasons: [] },
    source: {
      name: 'Test Source',
      type: 'test',
      source_url: 'https://example.com/',
      last_seen_at: '2026-01-01T00:00:00-05:00',
      confidence: 0.9,
    },
    moderation: { status: 'approved', risk_flags: [] },
    created_at: '2026-01-01T00:00:00-05:00',
    updated_at: '2026-01-01T00:00:00-05:00',
    ...overrides,
  } as CanonicalEvent;
}

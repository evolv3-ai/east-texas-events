import { describe, expect, it } from 'vitest';
import { makeEvent } from '../../events/__tests__/factories';
import {
  buildDescription,
  durationHours,
  mapEventToPayload,
  pickCategoryId,
  subScheduleNameFor,
  toUtcStartsAt,
  venueFromEvent,
  type EventScheduleCategory,
} from '../mapping';

const CATEGORIES: EventScheduleCategory[] = [
  { id: 1, name: 'Art & Culture' },
  { id: 3, name: 'Community' },
  { id: 4, name: 'Concerts' },
  { id: 6, name: 'Food & Drink' },
  { id: 8, name: 'Parties & Festivals' },
  { id: 10, name: 'Sports' },
];

const CONTEXT = { venueId: 'vEnUe1', categories: CATEGORIES };

describe('toUtcStartsAt', () => {
  it('converts a Central daylight time start to UTC without an offset', () => {
    expect(toUtcStartsAt('2026-10-27T19:00:00-05:00')).toBe('2026-10-28 00:00:00');
  });

  it('converts a Central standard time start to UTC', () => {
    expect(toUtcStartsAt('2026-12-05T18:30:00-06:00')).toBe('2026-12-06 00:30:00');
  });
});

describe('durationHours', () => {
  it('computes hours between start and end', () => {
    expect(durationHours('2026-10-27T19:00:00-05:00', '2026-10-27T21:30:00-05:00')).toBe(2.5);
  });

  it('spans multiple days for festivals', () => {
    expect(durationHours('2026-06-11T18:00:00-05:00', '2026-06-13T23:30:00-05:00')).toBe(53.5);
  });

  it('is null when there is no end', () => {
    expect(durationHours('2026-10-27T19:00:00-05:00', undefined)).toBeNull();
  });

  it('is null when the end is not after the start', () => {
    expect(durationHours('2026-10-27T19:00:00-05:00', '2026-10-27T19:00:00-05:00')).toBeNull();
  });

  it('caps at the API maximum of 8,760 hours', () => {
    expect(durationHours('2026-01-01T00:00:00-06:00', '2028-01-01T00:00:00-06:00')).toBe(8760);
  });

  it('rounds to two decimals', () => {
    expect(durationHours('2026-10-27T19:00:00-05:00', '2026-10-27T19:20:00-05:00')).toBe(0.33);
  });
});

describe('pickCategoryId', () => {
  it('maps live-music to Concerts', () => {
    expect(pickCategoryId(['live-music', 'nightlife'], CATEGORIES)).toBe(4);
  });

  it('maps festivals to Parties & Festivals', () => {
    expect(pickCategoryId(['festivals', 'food-drink'], CATEGORIES)).toBe(8);
  });

  it('prefers a custom Rodeo category and falls back to Sports without one', () => {
    expect(pickCategoryId(['rodeo'], CATEGORIES)).toBe(10);
    expect(pickCategoryId(['rodeo'], [...CATEGORIES, { id: 40, name: 'Rodeo' }])).toBe(40);
  });

  it('skips attribute-style categories while a specific one is present', () => {
    expect(pickCategoryId(['family-friendly', 'outdoor', 'performing-arts'], CATEGORIES)).toBe(1);
  });

  it('uses an attribute-style category when nothing else maps', () => {
    expect(pickCategoryId(['family-friendly'], CATEGORIES)).toBe(3);
  });

  it('matches category names regardless of case and punctuation', () => {
    expect(pickCategoryId(['festivals'], [{ id: 77, name: 'parties and festivals' }])).toBe(77);
  });

  it('is null when nothing maps', () => {
    expect(pickCategoryId(['unheard-of'], CATEGORIES)).toBeNull();
    expect(pickCategoryId(['live-music'], [])).toBeNull();
  });
});

describe('venueFromEvent', () => {
  it('builds a venue from the event location', () => {
    const venue = venueFromEvent(
      makeEvent({
        location: {
          name: 'Belcher Center',
          address1: '2100 S. Mobberly Ave',
          city: 'Longview',
          region: 'TX',
          postal_code: '75602',
          country: 'US',
        },
      }),
    );
    expect(venue).toEqual({
      key: 'belcher center|2100 s. mobberly ave|longview',
      name: 'Belcher Center',
      address1: '2100 S. Mobberly Ave',
      city: 'Longview',
      state: 'TX',
      postal_code: '75602',
      country_code: 'us',
    });
  });

  it('falls back to the city when the location has no name', () => {
    const venue = venueFromEvent(makeEvent());
    expect(venue.name).toBe('Kilgore, TX');
    expect(venue.key).toBe('kilgore, tx||kilgore');
    expect(venue.address1).toBeUndefined();
  });

  it('gives the same key to the same venue written with different spacing and case', () => {
    const a = venueFromEvent(makeEvent({ location: { name: 'Maude Cobb  Convention Center', address1: '100 Grand Blvd.', city: 'Longview', region: 'TX', country: 'US' } }));
    const b = venueFromEvent(makeEvent({ location: { name: ' maude cobb convention center', address1: '100 grand blvd.', city: 'LONGVIEW', region: 'TX', country: 'US' } }));
    expect(a.key).toBe(b.key);
  });
});

describe('subScheduleNameFor', () => {
  it('files 15-mile events under Near Shallow Creek RV Park', () => {
    expect(subScheduleNameFor(makeEvent({ geo: { radius_tier: 15 } }))).toBe('Near Shallow Creek RV Park');
  });

  it('files nothing else under a sub-schedule', () => {
    expect(subScheduleNameFor(makeEvent({ geo: { radius_tier: 50 } }))).toBeUndefined();
    expect(subScheduleNameFor(makeEvent())).toBeUndefined();
  });
});

describe('buildDescription', () => {
  const full = makeEvent({
    description: 'Three nights of rodeo.',
    why_go: 'A classic East Texas rodeo.',
    best_for: ['families', 'rodeo fans'],
    trip_planning_notes: ['Arrive early for parking.', 'Bring cash.'],
    geo: { distance_from_park_miles: 8.5, radius_tier: 15, estimated_drive_time_minutes: 15 },
    links: {
      web_url: 'https://gladewaterrodeo.com/',
      source_url: 'https://gladewaterrodeo.com/schedule',
      tickets_url: 'https://tickets.example.com/rodeo',
    },
    admission: { requires_ticket: true, price_min: 12, price_max: 26, currency: 'USD', availability: 'available' },
    rv_context: {
      family_friendly: true,
      pet_friendly: null,
      outdoor: true,
      rainy_day_friendly: false,
      rv_parking_notes: 'Oversize parking on the north lot.',
      ideal_stay_length_days: 2,
      booking_prompt: 'Stay at Shallow Creek RV Park for rodeo weekend.',
    },
  });

  it('keeps the description first and appends each section in order', () => {
    const text = buildDescription(full);
    expect(text.startsWith('Three nights of rodeo.')).toBe(true);
    const order = ['### Why go', '### Best for', '### Trip notes', '### RV notes', '### Admission', 'Source: '].map((heading) =>
      text.indexOf(heading),
    );
    expect(order.every((index) => index > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('writes why-go, best-for and trip notes', () => {
    const text = buildDescription(full);
    expect(text).toContain('### Why go\n\nA classic East Texas rodeo.');
    expect(text).toContain('### Best for\n\nfamilies, rodeo fans');
    expect(text).toContain('### Trip notes\n\n- Arrive early for parking.\n- Bring cash.');
  });

  it('writes RV notes from known values and skips unknown ones', () => {
    const text = buildDescription(full);
    expect(text).toContain('- About 8.5 miles from Shallow Creek RV Park (about 15 minutes by car)');
    expect(text).toContain('- Family friendly: yes');
    expect(text).toContain('- Outdoor: yes');
    expect(text).toContain('- Rainy-day friendly: no');
    expect(text).toContain('- RV parking: Oversize parking on the north lot.');
    expect(text).toContain('- Suggested stay: 2 days');
    expect(text).toContain('- Stay at Shallow Creek RV Park for rodeo weekend.');
    expect(text).not.toContain('Pet friendly');
    expect(text).not.toContain('Senior friendly');
  });

  it('writes a price range and the official site under Admission', () => {
    const text = buildDescription(full);
    expect(text).toContain('### Admission\n\n$12 to $26. Ticket required.');
    expect(text).toContain('Official site: <https://gladewaterrodeo.com/>');
  });

  it('writes the source link last', () => {
    const text = buildDescription(full);
    expect(text.endsWith('Source: [Test Source](https://gladewaterrodeo.com/schedule)')).toBe(true);
  });

  it('describes free admission', () => {
    const text = buildDescription(makeEvent({ admission: { is_free: true, currency: 'USD', availability: 'not_applicable' } }));
    expect(text).toContain('### Admission\n\nFree.');
  });

  it('notes a sold-out event', () => {
    const text = buildDescription(
      makeEvent({ admission: { price_min: 49.5, price_max: 49.5, currency: 'USD', availability: 'sold_out' } }),
    );
    expect(text).toContain('$49.50. Sold out.');
  });

  it('omits sections that have nothing to say', () => {
    const text = buildDescription(makeEvent());
    expect(text).toBe('Source: [Test Source](https://example.com/)');
  });

  it('leads with a status note for a postponed event', () => {
    const text = buildDescription(makeEvent({ status: 'postponed', description: 'A show.' }));
    expect(text.startsWith('**Postponed.** Check the source below for the new date before travelling.\n\nA show.')).toBe(true);
  });

  it('shortens an oversized description but keeps every appended section', () => {
    const text = buildDescription(makeEvent({ description: 'x'.repeat(12000), why_go: 'Because.' }));
    expect(text.length).toBeLessThanOrEqual(10000);
    expect(text).toContain('### Why go\n\nBecause.');
    expect(text.endsWith('Source: [Test Source](https://example.com/)')).toBe(true);
  });
});

describe('mapEventToPayload', () => {
  const event = makeEvent({
    title: 'Trace Adkins',
    agent_summary: 'Country concert at the Belcher Center in Longview for an evening out.',
    description: 'An evening of country music.',
    start_at: '2026-10-27T19:00:00-05:00',
    end_at: '2026-10-27T22:00:00-05:00',
    categories: ['live-music', 'performing-arts'],
    geo: { radius_tier: 15 },
    links: { source_url: 'https://example.com/', tickets_url: 'https://tickets.example.com/trace' },
    admission: { purchase_url: 'https://other.example.com/buy', currency: 'USD', availability: 'available' },
  });

  it('maps the direct fields', () => {
    const payload = mapEventToPayload(event, CONTEXT);
    expect(payload).toMatchObject({
      name: 'Trace Adkins',
      short_description: 'Country concert at the Belcher Center in Longview for an evening out.',
      starts_at: '2026-10-28 00:00:00',
      duration: 3,
      category_id: 4,
      venue_id: 'vEnUe1',
      is_draft: false,
    });
    expect(payload.description.startsWith('An evening of country music.')).toBe(true);
  });

  it('never sets event_url', () => {
    const payload = mapEventToPayload(
      makeEvent({ links: { web_url: 'https://official.example.com/', source_url: 'https://example.com/' } }),
      CONTEXT,
    );
    expect(Object.keys(payload)).not.toContain('event_url');
    expect(JSON.stringify(payload.registration_url)).toBe('null');
  });

  it('uses the tickets link for registration_url, then the purchase link', () => {
    expect(mapEventToPayload(event, CONTEXT).registration_url).toBe('https://tickets.example.com/trace');
    const purchaseOnly = makeEvent({
      admission: { purchase_url: 'https://other.example.com/buy', currency: 'USD', availability: 'available' },
    });
    expect(mapEventToPayload(purchaseOnly, CONTEXT).registration_url).toBe('https://other.example.com/buy');
  });

  it('sends null for values the event does not have, so an update clears them', () => {
    const payload = mapEventToPayload(makeEvent({ categories: ['unheard-of'] }), CONTEXT);
    expect(payload.duration).toBeNull();
    expect(payload.registration_url).toBeNull();
    expect(payload.category_id).toBeNull();
  });

  it('names the sub-schedule slug only when the context provides one', () => {
    expect(mapEventToPayload(event, CONTEXT)).not.toHaveProperty('schedule');
    expect(mapEventToPayload(event, { ...CONTEXT, subScheduleSlug: 'near-shallow-creek-rv-park' }).schedule).toBe(
      'near-shallow-creek-rv-park',
    );
  });

  it('marks postponed and tentative events in the name', () => {
    expect(mapEventToPayload(makeEvent({ title: 'Fair', status: 'postponed' }), CONTEXT).name).toBe('Postponed: Fair');
    expect(mapEventToPayload(makeEvent({ title: 'Fair', status: 'tentative' }), CONTEXT).name).toBe('Tentative: Fair');
  });

  it('keeps name and short description inside the API limits', () => {
    const payload = mapEventToPayload(makeEvent({ title: 't'.repeat(300), agent_summary: 's'.repeat(600) }), CONTEXT);
    expect(payload.name).toHaveLength(255);
    expect(payload.short_description).toHaveLength(500);
    expect(payload.short_description.endsWith('…')).toBe(true);
  });
});

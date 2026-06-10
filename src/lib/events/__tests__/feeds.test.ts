import { describe, expect, it } from 'vitest';
import { eventsToRss } from '../rss';
import { eventsToIcs } from '../ics';
import { makeEvent } from './factories';
import type { PublicEventsFeed } from '../schema';

const SITE = 'https://events.shallowcreek.com';

function makeFeed(events = [makeEvent()]): PublicEventsFeed {
  return {
    schema_version: 'events-feed.v0.1',
    generated_at: '2026-06-10T15:00:00-05:00',
    timezone: 'America/Chicago',
    event_count: events.length,
    source_count: 1,
    filters: { cities: ['Kilgore'], categories: ['test'], radius_tiers: [15] },
    events,
  };
}

describe('eventsToRss', () => {
  it('produces an RSS 2.0 document with channel metadata', () => {
    const xml = eventsToRss(makeFeed(), SITE);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain('<title>East Texas Events</title>');
    expect(xml).toContain(`<atom:link href="${SITE}/events.rss.xml" rel="self"`);
  });

  it('renders one item per event with absolute permalink', () => {
    const xml = eventsToRss(makeFeed([makeEvent({ slug: 'my-event' })]), SITE);
    expect(xml).toContain(`<link>${SITE}/events/my-event/</link>`);
    expect(xml).toContain('<guid isPermaLink="true">');
  });

  it('escapes XML special characters in titles', () => {
    const xml = eventsToRss(makeFeed([makeEvent({ title: 'Q&A <Live>' })]), SITE);
    expect(xml).toContain('Q&amp;A &lt;Live&gt;');
    expect(xml).not.toContain('Q&A <Live>');
  });

  it('formats pubDate as RFC 822', () => {
    const xml = eventsToRss(
      makeFeed([makeEvent({ updated_at: '2026-06-10T15:00:00-05:00' })]),
      SITE,
    );
    expect(xml).toContain('<pubDate>Wed, 10 Jun 2026 20:00:00 GMT</pubDate>');
  });
});

describe('eventsToIcs', () => {
  it('produces a VCALENDAR with one VEVENT per event', () => {
    const ics = eventsToIcs(makeFeed(), SITE);
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true);
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('uses CRLF line endings', () => {
    const ics = eventsToIcs(makeFeed(), SITE);
    expect(ics).toContain('\r\n');
    expect(ics.split('\r\n').join('')).not.toContain('\n');
  });

  it('formats DTSTART/DTEND as UTC basic format', () => {
    const ics = eventsToIcs(
      makeFeed([
        makeEvent({ start_at: '2026-06-12T17:00:00-05:00', end_at: '2026-06-14T09:00:00-05:00' }),
      ]),
      SITE,
    );
    expect(ics).toContain('DTSTART:20260612T220000Z');
    expect(ics).toContain('DTEND:20260614T140000Z');
  });

  it('omits DTEND when end_at is absent', () => {
    const event = makeEvent();
    delete (event as { end_at?: string }).end_at;
    const ics = eventsToIcs(makeFeed([event]), SITE);
    expect(ics).not.toContain('DTEND');
  });

  it('builds UID from event id and site host', () => {
    const ics = eventsToIcs(makeFeed([makeEvent({ id: 'evt_abc' })]), SITE);
    expect(ics).toContain('UID:evt_abc@events.shallowcreek.com');
  });

  it('escapes commas and semicolons in text fields', () => {
    const event = makeEvent();
    event.location = { name: 'Hall A, Wing B; East', city: 'Kilgore', region: 'TX', country: 'US' };
    const ics = eventsToIcs(makeFeed([event]), SITE);
    expect(ics).toContain('Hall A\\, Wing B\\; East');
  });
});

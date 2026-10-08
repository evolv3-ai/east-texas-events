import { describe, expect, it } from 'vitest';
import { makeEvent } from '../../events/__tests__/factories';
import { publicEventsFeedSchema } from '../../events/schema';
import { buildEventsJson, buildLlmsTxt, buildOpenApi, buildSitemapIndex, buildStaticFiles, STATIC_FILES } from '../static';
import { emptyIdMap, type IdMap } from '../sync';

const idMap: IdMap = {
  ...emptyIdMap(),
  venues: {
    'maude cobb|100 grand blvd.|longview': { id: 'v2', subdomain: 'maude', hash: 'h' },
    'belcher center|2100 s. mobberly ave|longview': { id: 'v1', subdomain: 'belcher', hash: 'h' },
  },
  events: { evt_show: { id: 'zILnV8', url: 'https://e-tex.events/belcher/show/zILnV8', hash: 'h', sub_schedule: null } },
};

const options = {
  events: [
    makeEvent({ id: 'evt_show', slug: 'show', categories: ['live-music'], geo: { radius_tier: 15 as const } }),
    makeEvent({ id: 'evt_unsent', slug: 'unsent', location: { city: 'Longview', region: 'TX', country: 'US' } }),
  ],
  idMap,
  publicUrl: 'https://e-tex.events/',
  schedulePath: 'calendar',
  now: new Date('2026-10-07T12:00:00Z'),
};

describe('buildEventsJson', () => {
  const feed = JSON.parse(buildEventsJson(options));

  it('is a valid public events feed', () => {
    expect(() => publicEventsFeedSchema.parse(feed)).not.toThrow();
    expect(feed.event_count).toBe(2);
    expect(feed.generated_at).toBe('2026-10-07T12:00:00.000Z');
    expect(feed.filters).toEqual({ cities: ['Kilgore', 'Longview'], categories: ['live-music', 'test'], radius_tiers: [15] });
  });

  it('keeps the fields Event Schedule has no home for', () => {
    expect(feed.events[0]).toMatchObject({ source: { name: 'Test Source', confidence: 0.9 }, moderation: { status: 'approved' } });
  });

  it('points at the calendar, its feeds and each synced event page', () => {
    expect(feed.calendar).toEqual({
      url: 'https://e-tex.events/calendar',
      rss_url: 'https://e-tex.events/calendar/feed/rss',
      ical_url: 'https://e-tex.events/calendar/feed/ical',
      near_park_url: 'https://e-tex.events/calendar?schedule=near-shallow-creek-rv-park',
      event_pages: { evt_show: 'https://e-tex.events/belcher/show/zILnV8' },
    });
  });
});

describe('buildLlmsTxt', () => {
  const text = buildLlmsTxt(options);

  it('describes this site, not the Event Schedule product', () => {
    expect(text.startsWith('# East Texas Events\n')).toBe(true);
    expect(text).not.toContain('eventschedule.com');
  });

  it('links the agent surfaces and the native feeds', () => {
    for (const url of [
      'https://e-tex.events/events.json',
      'https://e-tex.events/openapi.json',
      'https://e-tex.events/calendar/feed/rss',
      'https://e-tex.events/calendar/feed/ical',
      'https://e-tex.events/sitemap-index.xml',
      'https://e-tex.events/calendar?schedule=near-shallow-creek-rv-park',
    ]) {
      expect(text).toContain(`(${url})`);
    }
  });
});

describe('buildOpenApi', () => {
  it('describes the public read-only paths', () => {
    const spec = JSON.parse(buildOpenApi(options));
    expect(spec.openapi).toBe('3.1.0');
    expect(spec.servers).toEqual([{ url: 'https://e-tex.events' }]);
    expect(Object.keys(spec.paths)).toEqual([
      '/events.json',
      '/llms.txt',
      '/calendar/feed/rss',
      '/calendar/feed/ical',
      '/sitemap-index.xml',
    ]);
  });
});

describe('buildSitemapIndex', () => {
  it('lists the calendar sitemap and one per venue', () => {
    const xml = buildSitemapIndex(options);
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    expect(locs).toEqual([
      'https://e-tex.events/calendar/sitemap.xml',
      'https://e-tex.events/belcher/sitemap.xml',
      'https://e-tex.events/maude/sitemap.xml',
    ]);
    expect(xml).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  });
});

describe('buildStaticFiles', () => {
  it('produces every static file', () => {
    expect(Object.keys(buildStaticFiles(options)).sort()).toEqual([...STATIC_FILES].sort());
  });
});

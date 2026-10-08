import { publicEventsFeedSchema, type CanonicalEvent } from '../events/schema';
import { NEAR_PARK_SUB_SCHEDULE } from './mapping';
import type { IdMap } from './sync';

export interface StaticSiteOptions {
  /** Approved, flag-free, current events: the same set the sync keeps on Event Schedule. */
  events: CanonicalEvent[];
  idMap: IdMap;
  /** Public origin of the Event Schedule install, for example https://e-tex.events. */
  publicUrl: string;
  schedulePath: string;
  now: Date;
}

export const STATIC_FILES = ['events.json', 'llms.txt', 'openapi.json', 'sitemap-index.xml'] as const;
export type StaticFileName = (typeof STATIC_FILES)[number];

const SCHEMA_VERSION = 'events-feed.v0.1';
const NEAR_PARK_SLUG = NEAR_PARK_SUB_SCHEDULE.toLowerCase().replace(/[^a-z0-9]+/g, '-');

function siteUrls(options: Pick<StaticSiteOptions, 'publicUrl' | 'schedulePath'>) {
  const origin = options.publicUrl.replace(/\/+$/, '');
  const calendar = `${origin}/${options.schedulePath}`;
  return {
    origin,
    calendar,
    rss: `${calendar}/feed/rss`,
    ical: `${calendar}/feed/ical`,
    nearPark: `${calendar}?schedule=${NEAR_PARK_SLUG}`,
  };
}

/**
 * The full event model, which Event Schedule has no fields for: provenance, RV context, relevance
 * and moderation survive only here. `calendar` points each event at its page on the site.
 */
export function buildEventsJson(options: StaticSiteOptions): string {
  const { events, idMap, now } = options;
  const urls = siteUrls(options);
  const feed = publicEventsFeedSchema.parse({
    schema_version: SCHEMA_VERSION,
    generated_at: now.toISOString(),
    timezone: 'America/Chicago',
    event_count: events.length,
    source_count: new Set(events.map((event) => event.source.name)).size,
    filters: {
      cities: [...new Set(events.map((event) => event.location.city))].sort(),
      categories: [...new Set(events.flatMap((event) => event.categories))].sort(),
      radius_tiers: [...new Set(events.map((event) => event.geo.radius_tier).filter((tier): tier is 15 | 50 => Boolean(tier)))].sort(
        (a, b) => a - b,
      ),
    },
    events,
  });

  const event_pages = Object.fromEntries(
    events.filter((event) => idMap.events[event.id]).map((event) => [event.id, idMap.events[event.id].url]),
  );
  return `${JSON.stringify(
    { ...feed, calendar: { url: urls.calendar, rss_url: urls.rss, ical_url: urls.ical, near_park_url: urls.nearPark, event_pages } },
    null,
    2,
  )}\n`;
}

/** Replaces the stock /llms.txt, which describes the Event Schedule product rather than this site. */
export function buildLlmsTxt(options: StaticSiteOptions): string {
  const urls = siteUrls(options);
  return [
    '# East Texas Events',
    '',
    '> Curated events around Longview, Kilgore and the Piney Woods of East Texas, each verified against its official source and annotated for RV travellers staying at Shallow Creek RV Park.',
    '',
    `Generated: ${options.now.toISOString()}`,
    `Schema version: ${SCHEMA_VERSION}`,
    `Upcoming events: ${options.events.length}`,
    '',
    '## Machine-readable surfaces',
    '',
    `- [JSON feed](${urls.origin}/events.json): every upcoming event with source attribution, RV context, admission and relevance`,
    `- [OpenAPI description](${urls.origin}/openapi.json): the public read-only surfaces`,
    `- [RSS feed](${urls.rss}): upcoming events`,
    `- [iCalendar feed](${urls.ical}): upcoming events`,
    `- [Sitemap index](${urls.origin}/sitemap-index.xml): the calendar and every venue page`,
    '',
    '## Pages',
    '',
    `- [Calendar](${urls.calendar}): all upcoming events`,
    `- [Near Shallow Creek RV Park](${urls.nearPark}): events within 15 miles of the park`,
    '',
    '## Usage guidance for agents',
    '',
    '- Prefer /events.json for structured extraction; `calendar.event_pages` maps each event id to its page.',
    '- Each event page carries schema.org Event JSON-LD.',
    '- Cite `links.source_url`: it is the official page the event was verified against.',
    '- Dates are ISO-8601 with offsets, in the America/Chicago timezone.',
    '- Do not infer cancellation, pricing or ticket availability beyond the explicit fields.',
    '- Only approved events with no open verification flags are published.',
    '',
  ].join('\n');
}

export function buildOpenApi(options: StaticSiteOptions): string {
  const urls = siteUrls(options);
  const path = `/${options.schedulePath}`;
  const get = (summary: string, description: string, contentType: string) => ({
    get: { summary, responses: { '200': { description, content: { [contentType]: {} } } } },
  });
  return `${JSON.stringify(
    {
      openapi: '3.1.0',
      info: {
        title: 'East Texas Events',
        version: SCHEMA_VERSION,
        description:
          'Public, read-only, agent-oriented surfaces of the East Texas events calendar. The calendar itself runs on Event Schedule; its management API needs a key and is not described here.',
      },
      servers: [{ url: urls.origin }],
      paths: {
        '/events.json': get(
          'List upcoming approved East Texas events',
          'Event feed with source attribution, RV context and links to each event page',
          'application/json',
        ),
        '/llms.txt': get('Agent usage guide', 'Plain-text guide to these surfaces', 'text/plain'),
        [`${path}/feed/rss`]: get('RSS feed of upcoming events', 'RSS 2.0 feed', 'application/rss+xml'),
        [`${path}/feed/ical`]: get('iCalendar feed of upcoming events', 'RFC 5545 iCalendar document', 'text/calendar'),
        '/sitemap-index.xml': get('Sitemap index', 'Index of the calendar and venue sitemaps', 'application/xml'),
      },
    },
    null,
    2,
  )}\n`;
}

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/**
 * Event Schedule's root sitemap does not list schedules, and an event is listed in its venue's
 * sitemap rather than the curator's, so search engines need an index of every schedule sitemap.
 */
export function buildSitemapIndex(options: StaticSiteOptions): string {
  const urls = siteUrls(options);
  const paths = [options.schedulePath, ...[...new Set(Object.values(options.idMap.venues).map((venue) => venue.subdomain))].sort()];
  const lastmod = options.now.toISOString();
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.map(
      (path) => `  <sitemap><loc>${escapeXml(`${urls.origin}/${path}/sitemap.xml`)}</loc><lastmod>${lastmod}</lastmod></sitemap>`,
    ),
    '</sitemapindex>',
    '',
  ].join('\n');
}

export function buildStaticFiles(options: StaticSiteOptions): Record<StaticFileName, string> {
  return {
    'events.json': buildEventsJson(options),
    'llms.txt': buildLlmsTxt(options),
    'openapi.json': buildOpenApi(options),
    'sitemap-index.xml': buildSitemapIndex(options),
  };
}

import rawEvents from '@/data/events.seed.json';
import { eventSchema, publicEventsFeedSchema, type CanonicalEvent, type PublicEventsFeed } from './schema';

export function getApprovedEvents(): CanonicalEvent[] {
  return rawEvents
    .map((event) => eventSchema.parse(event))
    .filter((event) => event.moderation.status === 'approved')
    .sort((a, b) => a.start_at.localeCompare(b.start_at));
}

export function getEventBySlug(slug: string): CanonicalEvent | undefined {
  return getApprovedEvents().find((event) => event.slug === slug);
}

export function getEventsFeed(): PublicEventsFeed {
  const events = getApprovedEvents();
  const cities = [...new Set(events.map((event) => event.location.city))].sort();
  const categories = [...new Set(events.flatMap((event) => event.categories))].sort();
  const radius_tiers = [...new Set(events.map((event) => event.geo.radius_tier).filter((tier): tier is 15 | 50 => Boolean(tier)))].sort((a, b) => a - b);
  const source_count = new Set(events.map((event) => event.source.name)).size;

  return publicEventsFeedSchema.parse({
    schema_version: 'events-feed.v0.1',
    generated_at: new Date().toISOString(),
    timezone: 'America/Chicago',
    event_count: events.length,
    source_count,
    filters: { cities, categories, radius_tiers },
    events,
  });
}

export function formatEventDate(event: CanonicalEvent): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: event.end_at ? 'short' : 'short',
    timeZone: event.timezone,
  }).format(new Date(event.start_at));
}

import rawEvents from '@/data/events.seed.json';
import { eventSchema, publicEventsFeedSchema, type CanonicalEvent, type PublicEventsFeed } from './schema';

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
  const cities = [...new Set(events.map((event) => event.location.city))].sort();
  const categories = [...new Set(events.flatMap((event) => event.categories))].sort();
  const radius_tiers = [...new Set(events.map((event) => event.geo.radius_tier).filter((tier): tier is 15 | 50 => Boolean(tier)))].sort((a, b) => a - b);
  const source_count = new Set(events.map((event) => event.source.name)).size;

  return publicEventsFeedSchema.parse({
    schema_version: 'events-feed.v0.1',
    generated_at: now.toISOString(),
    timezone: 'America/Chicago',
    event_count: events.length,
    source_count,
    filters: { cities, categories, radius_tiers },
    events,
  });
}

export function formatEventDate(event: CanonicalEvent): string {
  const timeZone = event.timezone;
  const start = new Date(event.start_at);
  const startLabel = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(start);
  if (!event.end_at) return startLabel;

  const end = new Date(event.end_at);
  const dayOf = (date: Date) => new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone }).format(date);
  if (dayOf(start) === dayOf(end)) return startLabel;

  return `${startLabel} – ${dayOf(end)}`;
}

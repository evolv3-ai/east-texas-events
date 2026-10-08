import type { CanonicalEvent } from '../events/schema';

// Limits enforced by Event Schedule's ApiEventController validation rules.
export const NAME_MAX = 255;
export const SHORT_DESCRIPTION_MAX = 500;
export const DESCRIPTION_MAX = 10000;
export const DURATION_MAX_HOURS = 8760;

export const NEAR_PARK_SUB_SCHEDULE = 'Near Shallow Creek RV Park';

export interface EventScheduleCategory {
  id: number;
  name: string;
}

export interface MappingContext {
  /** Encoded ID of the venue schedule the event is attached to. */
  venueId: string;
  /** The curator schedule's effective category list (`GET /api/categories/{path}`). */
  categories: EventScheduleCategory[];
  /** Slug of the sub-schedule to file the event under, when it has one. */
  subScheduleSlug?: string;
}

/**
 * Body for `POST /api/events/{path}` and `PUT /api/events/{id}`.
 *
 * `event_url` is deliberately absent: Event Schedule treats it as the join link of an online
 * event and marks the page as online/hybrid for search engines. Source and official-site links
 * go in the description; ticket links go in `registration_url`.
 */
export interface EventSchedulePayload {
  name: string;
  short_description: string;
  description: string;
  starts_at: string;
  duration: number | null;
  category_id: number | null;
  registration_url: string | null;
  venue_id: string;
  is_draft: false;
  schedule?: string;
}

export interface VenueSpec {
  /** Stable identity of the venue inside the repo: normalised name, street address and city. */
  key: string;
  name: string;
  address1?: string;
  city: string;
  state: string;
  postal_code?: string;
  country_code: string;
}

interface CategoryRule {
  /** Event Schedule category names to try, in order of preference. */
  names: string[];
  /** Attribute-style tags that only decide the category when nothing more specific is present. */
  weak?: boolean;
}

/**
 * Project category slug to Event Schedule category name. Event Schedule allows one category per
 * event, so the first specific slug on the event wins. Names are matched against the schedule's
 * own list, so a category added in the admin panel (for example "Rodeo") is picked up as soon as
 * it exists and the fallback is used until then.
 */
const CATEGORY_RULES: Record<string, CategoryRule> = {
  'live-music': { names: ['Concerts'] },
  festivals: { names: ['Parties & Festivals'] },
  fireworks: { names: ['Parties & Festivals'] },
  nightlife: { names: ['Parties & Festivals'] },
  rodeo: { names: ['Rodeo', 'Sports'] },
  sports: { names: ['Sports'] },
  'performing-arts': { names: ['Art & Culture'] },
  arts: { names: ['Art & Culture'] },
  expo: { names: ['Expos & Shows', 'Community'] },
  'food-drink': { names: ['Food & Drink'] },
  education: { names: ['Education'] },
  community: { names: ['Community'] },
  outdoor: { names: ['Outdoors', 'Community'], weak: true },
  'family-friendly': { names: ['Family', 'Community'], weak: true },
};

const pad = (value: number) => String(value).padStart(2, '0');

/** `starts_at` as Event Schedule reads it: UTC, `Y-m-d H:i:s`, no offset. */
export function toUtcStartsAt(startAt: string): string {
  const date = new Date(startAt);
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
  );
}

/** Event Schedule has no end time, only a duration in hours. */
export function durationHours(startAt: string, endAt: string | undefined): number | null {
  if (!endAt) return null;
  const hours = (new Date(endAt).getTime() - new Date(startAt).getTime()) / 3_600_000;
  if (!(hours > 0)) return null;
  return Math.min(Math.round(hours * 100) / 100, DURATION_MAX_HOURS);
}

const normalizeName = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export function pickCategoryId(categories: string[], available: EventScheduleCategory[]): number | null {
  const byName = new Map(available.map((category) => [normalizeName(category.name), category.id]));
  for (const weak of [false, true]) {
    for (const slug of categories) {
      const rule = CATEGORY_RULES[slug];
      if (!rule || Boolean(rule.weak) !== weak) continue;
      for (const name of rule.names) {
        const id = byName.get(normalizeName(name));
        if (id !== undefined) return id;
      }
    }
  }
  return null;
}

const collapse = (value: string | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();

export function venueFromEvent(event: CanonicalEvent): VenueSpec {
  const { location } = event;
  const city = collapse(location.city);
  const name = collapse(location.name) || `${city}, ${location.region}`;
  const address1 = collapse(location.address1) || undefined;
  return {
    key: [name, address1 ?? '', city].map((part) => part.toLowerCase()).join('|'),
    name,
    ...(address1 ? { address1 } : {}),
    city,
    state: location.region,
    ...(location.postal_code ? { postal_code: location.postal_code } : {}),
    country_code: location.country.toLowerCase(),
  };
}

/** The proximity page becomes a sub-schedule: one per event, taken from the radius tier. */
export function subScheduleNameFor(event: CanonicalEvent): string | undefined {
  return event.geo.radius_tier === 15 ? NEAR_PARK_SUB_SCHEDULE : undefined;
}

const money = (value: number) => `$${Number.isInteger(value) ? value : value.toFixed(2)}`;

function admissionLine(admission: CanonicalEvent['admission']): string | undefined {
  const parts: string[] = [];
  const { price_min: min, price_max: max } = admission;
  if (admission.is_free) parts.push('Free.');
  else if (min !== undefined && max !== undefined) parts.push(min === max ? `${money(min)}.` : `${money(min)} to ${money(max)}.`);
  else if (min !== undefined) parts.push(`From ${money(min)}.`);
  else if (max !== undefined) parts.push(`Up to ${money(max)}.`);

  if (!admission.is_free && admission.requires_ticket) parts.push('Ticket required.');
  if (admission.registration_required) parts.push('Registration required.');
  if (admission.availability === 'sold_out') parts.push('Sold out.');
  return parts.length > 0 ? parts.join(' ') : undefined;
}

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

function rvNotes(event: CanonicalEvent): string[] {
  const { geo, rv_context: rv } = event;
  const notes: string[] = [];

  if (geo.distance_from_park_miles !== undefined) {
    const drive = geo.estimated_drive_time_minutes
      ? ` (about ${plural(geo.estimated_drive_time_minutes, 'minute')} by car)`
      : '';
    notes.push(`About ${plural(geo.distance_from_park_miles, 'mile')} from Shallow Creek RV Park${drive}`);
  }

  const flags: Array<[string, boolean | null | undefined]> = [
    ['Family friendly', rv.family_friendly],
    ['Pet friendly', rv.pet_friendly],
    ['Outdoor', rv.outdoor],
    ['Rainy-day friendly', rv.rainy_day_friendly],
    ['Senior friendly', rv.senior_friendly],
  ];
  for (const [label, value] of flags) {
    if (typeof value === 'boolean') notes.push(`${label}: ${value ? 'yes' : 'no'}`);
  }

  if (rv.rv_parking_notes) notes.push(`RV parking: ${rv.rv_parking_notes}`);
  if (rv.ideal_stay_length_days) notes.push(`Suggested stay: ${plural(rv.ideal_stay_length_days, 'day')}`);
  if (rv.booking_prompt) notes.push(rv.booking_prompt);
  return notes;
}

const STATUS_NOTES: Partial<Record<CanonicalEvent['status'], string>> = {
  postponed: '**Postponed.** Check the source below for the new date before travelling.',
  tentative: '**Tentative.** Details are not confirmed yet; check the source below before travelling.',
};

const bullets = (lines: string[]) => lines.map((line) => `- ${line}`).join('\n');

/**
 * Event Schedule has no fields for why-go, best-for, trip notes, RV context, admission or source
 * attribution, so they are appended to the Markdown description as sections.
 */
export function buildDescription(event: CanonicalEvent): string {
  const sections: string[] = [];

  if (event.why_go) sections.push(`### Why go\n\n${event.why_go}`);
  if (event.best_for.length > 0) sections.push(`### Best for\n\n${event.best_for.join(', ')}`);
  if (event.trip_planning_notes.length > 0) sections.push(`### Trip notes\n\n${bullets(event.trip_planning_notes)}`);

  const rv = rvNotes(event);
  if (rv.length > 0) sections.push(`### RV notes\n\n${bullets(rv)}`);

  const admission = [admissionLine(event.admission), event.links.web_url ? `Official site: <${event.links.web_url}>` : undefined].filter(
    (line): line is string => Boolean(line),
  );
  if (admission.length > 0) sections.push(`### Admission\n\n${admission.join('\n\n')}`);

  sections.push(`Source: [${event.source.name}](${event.links.source_url})`);

  const appended = sections.join('\n\n');
  const lead = [STATUS_NOTES[event.status], event.description?.trim()].filter((part): part is string => Boolean(part)).join('\n\n');
  if (!lead) return appended;

  const room = DESCRIPTION_MAX - appended.length - 2;
  return `${clip(lead, room)}\n\n${appended}`;
}

function clip(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(max - 1, 0)).trimEnd()}…`;
}

const NAME_PREFIXES: Partial<Record<CanonicalEvent['status'], string>> = {
  postponed: 'Postponed: ',
  tentative: 'Tentative: ',
};

export function mapEventToPayload(event: CanonicalEvent, context: MappingContext): EventSchedulePayload {
  return {
    name: clip(`${NAME_PREFIXES[event.status] ?? ''}${event.title}`, NAME_MAX),
    short_description: clip(event.agent_summary, SHORT_DESCRIPTION_MAX),
    description: buildDescription(event),
    starts_at: toUtcStartsAt(event.start_at),
    duration: durationHours(event.start_at, event.end_at),
    category_id: pickCategoryId(event.categories, context.categories),
    registration_url: event.links.tickets_url ?? event.admission.purchase_url ?? null,
    venue_id: context.venueId,
    is_draft: false,
    ...(context.subScheduleSlug ? { schedule: context.subScheduleSlug } : {}),
  };
}

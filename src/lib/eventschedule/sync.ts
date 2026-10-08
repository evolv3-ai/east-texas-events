import { createHash } from 'node:crypto';
import { z } from 'zod';
import { isPublishable } from '../events/data';
import type { CanonicalEvent } from '../events/schema';
import { collectFeedErrors } from '../events/validation';
import type { EventScheduleApi, RemoteEvent, RemoteSchedule, VenueBody } from './client';
import { mapEventToPayload, subScheduleNameFor, venueFromEvent, type EventScheduleCategory, type VenueSpec } from './mapping';

/**
 * Event Schedule has no external-ID field, so the repo keeps the pairing of its own event and
 * venue identities with Event Schedule's IDs. The file is committed and bound to one install.
 */
export const idMapSchema = z.object({
  version: z.literal(1),
  base_url: z.string().nullable(),
  schedule: z.string().nullable(),
  venues: z.record(z.string(), z.object({ id: z.string(), subdomain: z.string(), hash: z.string() })),
  events: z.record(
    z.string(),
    z.object({ id: z.string(), url: z.string(), hash: z.string(), sub_schedule: z.string().nullable() }),
  ),
});

export type IdMap = z.infer<typeof idMapSchema>;

export const emptyIdMap = (): IdMap => ({ version: 1, base_url: null, schedule: null, venues: {}, events: {} });

/** Keys sorted so the committed file only changes where the data did. */
export function serializeIdMap(map: IdMap): string {
  const sorted = <T>(record: Record<string, T>) => Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
  return `${JSON.stringify({ ...map, venues: sorted(map.venues), events: sorted(map.events) }, null, 2)}\n`;
}

export type Disposition = 'sync' | 'keep' | 'remove';

export interface Classification {
  disposition: Disposition;
  reason?: string;
}

/**
 * Decide what the sync owes one seed event.
 *
 * - `sync`: create it, or bring the copy on Event Schedule up to date.
 * - `keep`: send nothing and leave any existing copy alone (a past event outside archive mode).
 * - `remove`: it must not be public, so delete the copy if there is one.
 */
export function classifyEvent(event: CanonicalEvent, options: { now: Date; archive: boolean }): Classification {
  if (event.moderation.status !== 'approved') {
    return { disposition: 'remove', reason: `moderation status is ${event.moderation.status}` };
  }
  if (event.moderation.risk_flags.length > 0) {
    return { disposition: 'remove', reason: `unresolved risk flags: ${event.moderation.risk_flags.join(', ')}` };
  }
  // The API cannot mark an event cancelled, and a cancelled event left up reads as going ahead.
  if (event.status === 'cancelled') return { disposition: 'remove', reason: 'event is cancelled' };
  if (!isPublishable(event, options.now) && !options.archive) {
    return { disposition: 'keep', reason: 'event is past (pass --archive to sync past events)' };
  }
  return { disposition: 'sync' };
}

export type EventAction = 'create' | 'update' | 'unchanged' | 'delete' | 'skip' | 'error';

export interface EventResult {
  event_id: string;
  title: string;
  action: EventAction;
  es_id?: string;
  url?: string;
  reason?: string;
}

export interface VenueResult {
  key: string;
  name: string;
  action: 'create' | 'update' | 'unchanged' | 'error';
  es_id?: string;
  subdomain?: string;
  reason?: string;
}

export interface SyncReport {
  ok: boolean;
  dry_run: boolean;
  archive: boolean;
  /** False for a dry run without credentials: the plan then rests on the committed ID map alone. */
  remote_checked: boolean;
  schedule: string;
  counts: Record<EventAction, number>;
  events: EventResult[];
  venues: VenueResult[];
  warnings: string[];
  errors: string[];
}

export interface SyncOptions {
  events: CanonicalEvent[];
  idMap: IdMap;
  /** Omit only for a dry run without credentials. */
  api?: EventScheduleApi;
  baseUrl: string | null;
  schedulePath: string;
  /** Email set on venue schedules. Defaults to the curator schedule's own. */
  contactEmail?: string;
  now: Date;
  archive: boolean;
  dryRun: boolean;
  /** Called after every write that changes the ID map, so an interrupted run loses no ID. */
  saveIdMap?: (idMap: IdMap) => void;
}

export interface SyncResult {
  idMap: IdMap;
  report: SyncReport;
  /** Seed events that are approved, flag-free and current, cancelled ones included: what the static files describe. */
  upcoming: CanonicalEvent[];
}

const PENDING_VENUE = '(venue to be created)';
const EXPECTED_TIMEZONE = 'America/Chicago';

const hashOf = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);
const message = (error: unknown) => (error instanceof Error ? error.message : String(error));
const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export async function runSync(options: SyncOptions): Promise<SyncResult> {
  const { events, api, baseUrl, schedulePath, now, archive, dryRun, saveIdMap } = options;
  if (!api && !dryRun) throw new Error('an Event Schedule API client is required unless this is a dry run');

  // The ID map is keyed by seed id, so two entries sharing one would fight over a single page.
  const duplicateIds = [...new Set(events.map((event) => event.id).filter((id, index, ids) => ids.indexOf(id) !== index))];
  if (duplicateIds.length > 0) {
    throw new Error(`duplicate ids in the seed file, nothing was sent: ${duplicateIds.join(', ')}`);
  }

  const idMap = structuredClone(options.idMap);
  if (idMap.base_url && baseUrl && idMap.base_url !== baseUrl) {
    throw new Error(
      `the ID map belongs to ${idMap.base_url} but ES_BASE_URL is ${baseUrl}; IDs from one install mean nothing on another. ` +
        'Reset the map if the install was replaced.',
    );
  }
  if (idMap.schedule && idMap.schedule !== schedulePath) {
    throw new Error(`the ID map belongs to schedule "${idMap.schedule}" but the sync was pointed at "${schedulePath}"`);
  }

  if (!dryRun) {
    idMap.base_url = baseUrl;
    idMap.schedule = schedulePath;
  }

  const report: SyncReport = {
    ok: true,
    dry_run: dryRun,
    archive,
    remote_checked: Boolean(api),
    schedule: schedulePath,
    counts: { create: 0, update: 0, unchanged: 0, delete: 0, skip: 0, error: 0 },
    events: [],
    venues: [],
    warnings: [],
    errors: [],
  };
  const record = (result: EventResult) => {
    report.events.push(result);
    report.counts[result.action] += 1;
    if (result.action === 'error') report.errors.push(`${result.event_id}: ${result.reason}`);
  };

  const classified = events.map((event) => ({ event, ...classifyEvent(event, { now, archive }) }));
  const toSync = classified.filter((entry) => entry.disposition === 'sync').map((entry) => entry.event);
  const upcoming = events
    .filter((event) => event.moderation.risk_flags.length === 0 && isPublishable(event, now))
    .sort((a, b) => a.start_at.localeCompare(b.start_at));
  const gateErrors = collectFeedErrors([...new Set([...toSync, ...upcoming])], { release: true });
  if (gateErrors.length > 0) {
    throw new Error(`release gate failed, nothing was sent:\n${gateErrors.map((error) => `- ${error}`).join('\n')}`);
  }

  // --- Remote state -------------------------------------------------------------------------
  let categories: EventScheduleCategory[] = [];
  let groups = new Map<string, string>();
  let remoteVenues: RemoteSchedule[] = [];
  let remoteEvents: RemoteEvent[] = [];
  let contactEmail = options.contactEmail;

  if (api) {
    const curator = await api.getSchedule(schedulePath);
    if (curator.type !== 'curator') {
      throw new Error(`schedule "${schedulePath}" is a ${curator.type} schedule; the sync needs the curator schedule`);
    }
    if (!curator.email) {
      report.warnings.push(`schedule "${schedulePath}" has no email, so Event Schedule serves its pages as noindex`);
    }
    if (curator.timezone !== EXPECTED_TIMEZONE) {
      report.warnings.push(`schedule "${schedulePath}" is set to ${curator.timezone}; events are curated in ${EXPECTED_TIMEZONE}`);
    }
    contactEmail ??= curator.email ?? undefined;
    groups = new Map((curator.groups ?? []).map((group) => [group.name, group.slug]));
    [categories, remoteVenues, remoteEvents] = await Promise.all([
      api.listCategories(schedulePath),
      api.listVenues(),
      api.listEvents(schedulePath),
    ]);
  }
  const remoteEventIds = new Set(remoteEvents.map((event) => event.id));

  // --- Removals -----------------------------------------------------------------------------
  const seedIds = new Set(events.map((event) => event.id));
  const removals: Array<{ id: string; title: string; reason: string }> = [
    ...classified
      .filter((entry) => entry.disposition === 'remove' && idMap.events[entry.event.id])
      .map((entry) => ({ id: entry.event.id, title: entry.event.title, reason: entry.reason ?? 'not approved' })),
    ...Object.keys(idMap.events)
      .filter((id) => !seedIds.has(id))
      .map((id) => ({ id, title: id, reason: 'no longer in the seed file' })),
  ];
  for (const removal of removals) {
    const mapped = idMap.events[removal.id];
    try {
      if (!dryRun) {
        await api!.deleteEvent(mapped.id);
        delete idMap.events[removal.id];
        saveIdMap?.(idMap);
      }
      record({ event_id: removal.id, title: removal.title, action: 'delete', es_id: mapped.id, url: mapped.url, reason: removal.reason });
    } catch (error) {
      record({ event_id: removal.id, title: removal.title, action: 'error', es_id: mapped.id, reason: `delete failed: ${message(error)}` });
    }
  }
  for (const entry of classified) {
    if (entry.disposition === 'sync' || (entry.disposition === 'remove' && options.idMap.events[entry.event.id])) continue;
    record({ event_id: entry.event.id, title: entry.event.title, action: 'skip', reason: entry.reason });
  }

  // --- Sub-schedules ------------------------------------------------------------------------
  const subSchedules = new Map<string, string>();
  for (const name of new Set(toSync.map(subScheduleNameFor).filter((value): value is string => Boolean(value)))) {
    let slug = groups.get(name);
    if (!slug && api && !dryRun) slug = (await api.createGroup(schedulePath, name)).slug;
    subSchedules.set(name, slug ?? slugify(name));
  }

  // --- Venues -------------------------------------------------------------------------------
  const venueSpecs = new Map<string, VenueSpec>();
  for (const event of toSync) {
    const spec = venueFromEvent(event);
    venueSpecs.set(spec.key, spec);
  }
  if (venueSpecs.size > 0 && api && !contactEmail) {
    throw new Error(
      'no email for venue schedules: set one on the curator schedule or pass ES_CONTACT_EMAIL. ' +
        'Event Schedule keeps a venue page, and every event at it, out of search engines until the venue has an email.',
    );
  }
  const remoteVenueById = new Map(remoteVenues.map((venue) => [venue.id, venue]));
  const failedVenues = new Map<string, string>();

  for (const spec of venueSpecs.values()) {
    const { key, ...address } = spec;
    const body: VenueBody = { ...address, email: contactEmail ?? '' };
    const hash = hashOf(body);
    const mapped = idMap.venues[key];
    const known = mapped && (!api || remoteVenueById.has(mapped.id)) ? mapped : undefined;
    const action: VenueResult['action'] = known ? (known.hash === hash ? 'unchanged' : 'update') : 'create';

    try {
      if (!api || dryRun || action === 'unchanged') {
        report.venues.push({ key, name: spec.name, action, es_id: known?.id, subdomain: known?.subdomain });
        continue;
      }
      const saved = action === 'create' ? await api.createVenue(body) : await api.updateVenue(known!.subdomain, body);
      idMap.venues[key] = { id: saved.id, subdomain: saved.subdomain, hash };
      saveIdMap?.(idMap);
      report.venues.push({ key, name: spec.name, action, es_id: saved.id, subdomain: saved.subdomain });
    } catch (error) {
      failedVenues.set(key, message(error));
      report.venues.push({ key, name: spec.name, action: 'error', reason: message(error) });
      report.errors.push(`venue ${spec.name}: ${message(error)}`);
    }
  }

  // --- Events -------------------------------------------------------------------------------
  for (const event of toSync) {
    const base = { event_id: event.id, title: event.title };
    const venue = venueFromEvent(event);
    if (failedVenues.has(venue.key)) {
      record({ ...base, action: 'error', reason: `venue "${venue.name}" could not be saved: ${failedVenues.get(venue.key)}` });
      continue;
    }

    const subScheduleName = subScheduleNameFor(event);
    const subScheduleSlug = subScheduleName ? subSchedules.get(subScheduleName) : undefined;
    const payload = mapEventToPayload(event, {
      venueId: idMap.venues[venue.key]?.id ?? PENDING_VENUE,
      categories,
      subScheduleSlug,
    });
    const hash = hashOf(payload);

    // A mapped ID that Event Schedule no longer has (deleted in the admin panel) is created again.
    const stored = idMap.events[event.id];
    const mapped = stored && (!api || remoteEventIds.has(stored.id)) ? stored : undefined;
    if (!api && mapped) {
      // Without the remote category list the payload cannot be compared with what was sent.
      record({ ...base, action: 'unchanged', es_id: mapped.id, url: mapped.url, reason: 'mapped; not compared without credentials' });
      continue;
    }
    if (mapped?.hash === hash) {
      record({ ...base, action: 'unchanged', es_id: mapped.id, url: mapped.url });
      continue;
    }

    // An event can be removed from a sub-schedule only by recreating it: the API reads the
    // `schedule` field when present and leaves the filing alone when it is absent.
    const recreate = Boolean(mapped?.sub_schedule && !subScheduleSlug);
    const existingId = recreate ? undefined : mapped?.id;
    const action: EventAction = existingId ? 'update' : 'create';

    try {
      if (dryRun) {
        record({ ...base, action, es_id: existingId, url: mapped?.url });
        continue;
      }
      if (recreate) await api!.deleteEvent(mapped!.id);
      const saved = existingId ? await api!.updateEvent(existingId, payload) : await api!.createEvent(schedulePath, payload);
      idMap.events[event.id] = { id: saved.id, url: saved.url, hash, sub_schedule: subScheduleSlug ?? null };
      saveIdMap?.(idMap);
      record({ ...base, action, es_id: saved.id, url: saved.url });
    } catch (error) {
      record({ ...base, action: 'error', es_id: existingId, reason: message(error) });
    }
  }

  report.ok = report.errors.length === 0;
  return { idMap, report, upcoming };
}

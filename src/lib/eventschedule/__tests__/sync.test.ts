import { describe, expect, it } from 'vitest';
import { makeEvent } from '../../events/__tests__/factories';
import type { CanonicalEvent } from '../../events/schema';
import type { EventScheduleApi, RemoteEvent, RemoteGroup, RemoteSchedule, VenueBody } from '../client';
import type { EventSchedulePayload } from '../mapping';
import { buildEventsJson } from '../static';
import { classifyEvent, emptyIdMap, runSync, serializeIdMap, type IdMap, type SyncOptions } from '../sync';

const NOW = new Date('2026-10-07T12:00:00Z');
const FUTURE = '2026-11-14T19:00:00-06:00';
const PAST = '2026-06-20T19:00:00-05:00';

/** In-memory stand-in for an Event Schedule install, recording every write. */
class FakeApi implements EventScheduleApi {
  calls: string[] = [];
  curator: RemoteSchedule = {
    id: 'cur1',
    subdomain: 'calendar',
    url: 'https://es.test/calendar',
    type: 'curator',
    name: 'Calendar',
    email: 'hello@es.test',
    timezone: 'America/Chicago',
    groups: [],
  };
  venues: RemoteSchedule[] = [];
  venueBodies = new Map<string, VenueBody>();
  events = new Map<string, RemoteEvent & { payload: EventSchedulePayload }>();
  failCreateFor?: string;
  private nextId = 1;

  async getSchedule() {
    return this.curator;
  }
  async listVenues() {
    return this.venues;
  }
  async createVenue(body: VenueBody) {
    this.calls.push(`createVenue ${body.name}`);
    const id = `ven${this.nextId++}`;
    const venue: RemoteSchedule = {
      id,
      subdomain: body.name.split(' ')[0].toLowerCase(),
      url: '',
      type: 'venue',
      name: body.name,
      email: body.email,
      timezone: null,
    };
    this.venues.push(venue);
    this.venueBodies.set(id, body);
    return venue;
  }
  async updateVenue(path: string, body: VenueBody) {
    this.calls.push(`updateVenue ${path}`);
    const venue = this.venues.find((candidate) => candidate.subdomain === path)!;
    this.venueBodies.set(venue.id, body);
    return venue;
  }
  async createGroup(_path: string, name: string) {
    this.calls.push(`createGroup ${name}`);
    const group: RemoteGroup = { id: `grp${this.nextId++}`, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') };
    this.curator.groups!.push(group);
    return group;
  }
  async listCategories() {
    return [
      { id: 3, name: 'Community' },
      { id: 4, name: 'Concerts' },
    ];
  }
  async listEvents() {
    return [...this.events.values()];
  }
  async createEvent(_path: string, payload: EventSchedulePayload) {
    this.calls.push(`createEvent ${payload.name}`);
    if (payload.name === this.failCreateFor) throw new Error('POST /events/calendar -> 500: Server Error');
    const id = `evt${this.nextId++}`;
    const event = { id, url: `https://es.test/v/${id}`, payload };
    this.events.set(id, event);
    return event;
  }
  async updateEvent(id: string, payload: EventSchedulePayload) {
    this.calls.push(`updateEvent ${id}`);
    const event = { ...this.events.get(id)!, payload };
    this.events.set(id, event);
    return event;
  }
  async deleteEvent(id: string) {
    this.calls.push(`deleteEvent ${id}`);
    this.events.delete(id);
  }
}

const upcoming = (overrides: Partial<CanonicalEvent> = {}) =>
  makeEvent({
    id: 'evt_show',
    slug: 'show',
    title: 'Show',
    start_at: FUTURE,
    categories: ['live-music'],
    location: { name: 'Belcher Center', address1: '2100 S. Mobberly Ave', city: 'Longview', region: 'TX', country: 'US' },
    ...overrides,
  });

function options(api: FakeApi | undefined, events: CanonicalEvent[], idMap: IdMap, extra: Partial<SyncOptions> = {}): SyncOptions {
  return { events, idMap, api, baseUrl: 'https://es.test', schedulePath: 'calendar', now: NOW, archive: false, dryRun: false, ...extra };
}

describe('classifyEvent', () => {
  const at = { now: NOW, archive: false };

  it('syncs an approved, flag-free, upcoming event', () => {
    expect(classifyEvent(upcoming(), at).disposition).toBe('sync');
  });

  it('removes events that are not approved', () => {
    const event = upcoming({ moderation: { status: 'needs_review', risk_flags: [] } });
    expect(classifyEvent(event, at)).toEqual({ disposition: 'remove', reason: 'moderation status is needs_review' });
  });

  it('removes approved events that still carry a risk flag', () => {
    const event = upcoming({ moderation: { status: 'approved', risk_flags: ['seed-fixture'] } });
    expect(classifyEvent(event, at).disposition).toBe('remove');
  });

  it('removes cancelled events', () => {
    expect(classifyEvent(upcoming({ status: 'cancelled' }), at).disposition).toBe('remove');
  });

  it('keeps past events out of a normal run and syncs them in archive mode', () => {
    const past = upcoming({ start_at: PAST });
    expect(classifyEvent(past, at).disposition).toBe('keep');
    expect(classifyEvent(past, { now: NOW, archive: true }).disposition).toBe('sync');
  });

  it('never syncs an unapproved past event, even in archive mode', () => {
    const event = upcoming({ start_at: PAST, moderation: { status: 'pending', risk_flags: [] } });
    expect(classifyEvent(event, { now: NOW, archive: true }).disposition).toBe('remove');
  });
});

describe('runSync', () => {
  it('creates the venue with address and email, then the event, and records both IDs', async () => {
    const api = new FakeApi();
    const { idMap, report } = await runSync(options(api, [upcoming()], emptyIdMap()));

    expect(api.calls).toEqual(['createVenue Belcher Center', 'createEvent Show']);
    const venueEntry = idMap.venues['belcher center|2100 s. mobberly ave|longview'];
    expect(api.venueBodies.get(venueEntry.id)).toMatchObject({
      name: 'Belcher Center',
      address1: '2100 S. Mobberly Ave',
      city: 'Longview',
      email: 'hello@es.test',
    });
    const created = [...api.events.values()][0];
    expect(created.payload.venue_id).toBe(venueEntry.id);
    expect(created.payload.category_id).toBe(4);
    expect(idMap.events.evt_show).toMatchObject({ id: created.id, url: created.url, sub_schedule: null });
    expect(idMap.base_url).toBe('https://es.test');
    expect(idMap.schedule).toBe('calendar');
    expect(report.ok).toBe(true);
    expect(report.counts.create).toBe(1);
  });

  it('writes nothing on a second run with the same seed', async () => {
    const api = new FakeApi();
    const first = await runSync(options(api, [upcoming()], emptyIdMap()));
    api.calls = [];
    const second = await runSync(options(api, [upcoming()], first.idMap));

    expect(api.calls).toEqual([]);
    expect(second.report.counts.unchanged).toBe(1);
    expect(second.idMap).toEqual(first.idMap);
  });

  it('updates an event whose content changed', async () => {
    const api = new FakeApi();
    const first = await runSync(options(api, [upcoming()], emptyIdMap()));
    api.calls = [];
    const second = await runSync(options(api, [upcoming({ title: 'Show (new time)' })], first.idMap));

    expect(api.calls).toEqual([`updateEvent ${first.idMap.events.evt_show.id}`]);
    expect(second.report.counts.update).toBe(1);
    expect(second.idMap.events.evt_show.hash).not.toBe(first.idMap.events.evt_show.hash);
  });

  it('deletes an event that is no longer approved', async () => {
    const api = new FakeApi();
    const first = await runSync(options(api, [upcoming()], emptyIdMap()));
    api.calls = [];
    const pulled = upcoming({ moderation: { status: 'rejected', risk_flags: [] } });
    const second = await runSync(options(api, [pulled], first.idMap));

    expect(api.calls).toEqual([`deleteEvent ${first.idMap.events.evt_show.id}`]);
    expect(api.events.size).toBe(0);
    expect(second.idMap.events).toEqual({});
    expect(second.report.events).toEqual([expect.objectContaining({ event_id: 'evt_show', action: 'delete', reason: 'moderation status is rejected' })]);
  });

  it('deletes an event that left the seed file', async () => {
    const api = new FakeApi();
    const first = await runSync(options(api, [upcoming()], emptyIdMap()));
    const second = await runSync(options(api, [], first.idMap));

    expect(api.events.size).toBe(0);
    expect(second.report.counts.delete).toBe(1);
  });

  it('leaves events it did not create alone', async () => {
    const api = new FakeApi();
    api.events.set('manual1', { id: 'manual1', url: '', payload: { name: 'Added by hand' } as EventSchedulePayload });
    await runSync(options(api, [], emptyIdMap()));
    expect(api.events.has('manual1')).toBe(true);
  });

  it('never takes over an event or venue it did not create, even one with the same name and start time', async () => {
    const reference = new FakeApi();
    await runSync(options(reference, [upcoming()], emptyIdMap()));
    const twinPayload = [...reference.events.values()][0].payload;
    const twinVenueBody = [...reference.venueBodies.values()][0];

    const api = new FakeApi();
    api.events.set('manual1', { id: 'manual1', url: 'https://es.test/v/manual1', payload: twinPayload });
    api.venues.push({ id: 'manualVenue', subdomain: 'belcher-by-hand', url: '', type: 'venue', name: 'Belcher Center', email: null, timezone: null });
    api.venueBodies.set('manualVenue', twinVenueBody);

    const first = await runSync(options(api, [upcoming()], emptyIdMap()));
    expect(api.calls).toEqual(['createVenue Belcher Center', 'createEvent Show']);
    expect(first.idMap.events.evt_show.id).not.toBe('manual1');
    expect(Object.values(first.idMap.venues)[0].id).not.toBe('manualVenue');

    api.calls = [];
    await runSync(options(api, [upcoming({ title: 'Show (new time)' })], first.idMap));
    await runSync(options(api, [], first.idMap));
    expect(api.calls).toEqual([`updateEvent ${first.idMap.events.evt_show.id}`, `deleteEvent ${first.idMap.events.evt_show.id}`]);
    expect(api.events.get('manual1')?.payload).toBe(twinPayload);
    expect(api.venueBodies.get('manualVenue')).toBe(twinVenueBody);
  });

  it('skips past events unless archive mode is on, and leaves a synced one in place once it has passed', async () => {
    const api = new FakeApi();
    const past = upcoming({ start_at: PAST });
    const normal = await runSync(options(api, [past], emptyIdMap()));
    expect(api.calls).toEqual([]);
    expect(normal.report.events[0]).toMatchObject({ action: 'skip' });

    const archived = await runSync(options(api, [past], emptyIdMap(), { archive: true }));
    expect(archived.report.counts.create).toBe(1);

    api.calls = [];
    const later = await runSync(options(api, [past], archived.idMap));
    expect(api.calls).toEqual([]);
    expect(later.idMap.events.evt_show).toEqual(archived.idMap.events.evt_show);
  });

  it('files 15-mile events under the Near Shallow Creek RV Park sub-schedule, creating it once', async () => {
    const api = new FakeApi();
    const near = upcoming({ geo: { radius_tier: 15 } });
    const first = await runSync(options(api, [near], emptyIdMap()));

    expect(api.calls).toContain('createGroup Near Shallow Creek RV Park');
    expect([...api.events.values()][0].payload.schedule).toBe('near-shallow-creek-rv-park');
    expect(first.idMap.events.evt_show.sub_schedule).toBe('near-shallow-creek-rv-park');

    api.calls = [];
    await runSync(options(api, [near, upcoming({ id: 'evt_two', slug: 'two', title: 'Two', geo: { radius_tier: 15 } })], first.idMap));
    expect(api.calls).toEqual(['createEvent Two']);
  });

  it('recreates an event that left the 15-mile tier, since the API cannot unfile it', async () => {
    const api = new FakeApi();
    const first = await runSync(options(api, [upcoming({ geo: { radius_tier: 15 } })], emptyIdMap()));
    const oldId = first.idMap.events.evt_show.id;
    api.calls = [];
    const second = await runSync(options(api, [upcoming({ geo: { radius_tier: 50 } })], first.idMap));

    expect(api.calls).toEqual([`deleteEvent ${oldId}`, 'createEvent Show']);
    expect(second.idMap.events.evt_show.id).not.toBe(oldId);
    expect(second.idMap.events.evt_show.sub_schedule).toBeNull();
  });

  it('reuses one venue for every event held there', async () => {
    const api = new FakeApi();
    await runSync(options(api, [upcoming(), upcoming({ id: 'evt_two', slug: 'two', title: 'Two' })], emptyIdMap()));
    expect(api.calls.filter((call) => call.startsWith('createVenue'))).toHaveLength(1);
  });

  it('creates the event again when its mapped copy was deleted on Event Schedule', async () => {
    const api = new FakeApi();
    const first = await runSync(options(api, [upcoming()], emptyIdMap()));
    api.events.clear();
    api.calls = [];
    const second = await runSync(options(api, [upcoming()], first.idMap));

    expect(api.calls).toEqual(['createEvent Show']);
    expect(second.idMap.events.evt_show.id).not.toBe(first.idMap.events.evt_show.id);
  });

  it('writes nothing in a dry run and reports what it would do', async () => {
    const api = new FakeApi();
    const map = emptyIdMap();
    const { idMap, report } = await runSync(options(api, [upcoming({ geo: { radius_tier: 15 } })], map, { dryRun: true }));

    expect(api.calls).toEqual([]);
    expect(idMap).toEqual(map);
    expect(report.dry_run).toBe(true);
    expect(report.remote_checked).toBe(true);
    expect(report.venues[0].action).toBe('create');
    expect(report.events[0].action).toBe('create');
  });

  it('plans from the ID map alone in a dry run without credentials', async () => {
    const api = new FakeApi();
    const first = await runSync(options(api, [upcoming()], emptyIdMap()));
    const rejected = upcoming({ moderation: { status: 'rejected', risk_flags: [] } });
    const fresh = upcoming({ id: 'evt_new', slug: 'new', title: 'New' });
    const { report } = await runSync(options(undefined, [rejected, fresh], first.idMap, { dryRun: true }));

    expect(report.remote_checked).toBe(false);
    expect(report.events.map((event) => [event.event_id, event.action])).toEqual([
      ['evt_show', 'delete'],
      ['evt_new', 'create'],
    ]);
  });

  it('refuses a real run without an API client', async () => {
    await expect(runSync(options(undefined, [upcoming()], emptyIdMap()))).rejects.toThrow(/API client is required/);
  });

  it('refuses to use an ID map from another install', async () => {
    const map = { ...emptyIdMap(), base_url: 'https://other.test' };
    await expect(runSync(options(new FakeApi(), [upcoming()], map))).rejects.toThrow(/belongs to https:\/\/other.test/);
  });

  it('refuses to run against a schedule that is not a curator', async () => {
    const api = new FakeApi();
    api.curator.type = 'venue';
    await expect(runSync(options(api, [upcoming()], emptyIdMap()))).rejects.toThrow(/needs the curator schedule/);
  });

  it('refuses to create venues without an email', async () => {
    const api = new FakeApi();
    api.curator.email = null;
    await expect(runSync(options(api, [upcoming()], emptyIdMap()))).rejects.toThrow(/no email for venue schedules/);
    expect(api.calls).toEqual([]);
  });

  it('uses ES_CONTACT_EMAIL for venues when given', async () => {
    const api = new FakeApi();
    const { idMap } = await runSync(options(api, [upcoming()], emptyIdMap(), { contactEmail: 'venues@es.test' }));
    expect(api.venueBodies.get(Object.values(idMap.venues)[0].id)?.email).toBe('venues@es.test');
  });

  it('stops before sending anything when the release gate fails', async () => {
    const api = new FakeApi();
    const weak = upcoming();
    weak.source.confidence = 0.2;
    await expect(runSync(options(api, [weak], emptyIdMap()))).rejects.toThrow(/release gate failed/);
    expect(api.calls).toEqual([]);
  });

  it('does not let a past entry that is never sent stop the sync', async () => {
    const api = new FakeApi();
    const weakPast = upcoming({ id: 'evt_weak', slug: 'weak', start_at: PAST });
    weakPast.source.confidence = 0.2;
    const lastYear = upcoming({ id: 'evt_show_2025', start_at: PAST });
    const seed = [weakPast, lastYear, upcoming()];

    const { report } = await runSync(options(api, seed, emptyIdMap()));
    expect(report.ok).toBe(true);
    expect(api.calls).toEqual(['createVenue Belcher Center', 'createEvent Show']);

    api.calls = [];
    await expect(runSync(options(api, seed, emptyIdMap(), { archive: true }))).rejects.toThrow(/release gate failed/);
    expect(api.calls).toEqual([]);
  });

  it('carries on past a failed event, reports it, and keeps what did succeed', async () => {
    const api = new FakeApi();
    api.failCreateFor = 'Show';
    const { idMap, report } = await runSync(
      options(api, [upcoming(), upcoming({ id: 'evt_two', slug: 'two', title: 'Two' })], emptyIdMap()),
    );

    expect(report.ok).toBe(false);
    expect(report.counts).toMatchObject({ create: 1, error: 1 });
    expect(report.errors[0]).toContain('evt_show');
    expect(Object.keys(idMap.events)).toEqual(['evt_two']);
  });

  it('describes only approved, flag-free, current events as upcoming', async () => {
    const flagged = upcoming({ id: 'evt_flag', slug: 'flag', moderation: { status: 'approved', risk_flags: ['unverified'] } });
    const past = upcoming({ id: 'evt_past', slug: 'past', start_at: PAST });
    const { upcoming: list } = await runSync(options(new FakeApi(), [upcoming(), flagged, past], emptyIdMap(), { archive: true }));
    expect(list.map((event) => event.id)).toEqual(['evt_show']);
  });
});

describe('cancelled events', () => {
  it('takes the page down but keeps the event, with its cancelled status, in events.json', async () => {
    const api = new FakeApi();
    const other = upcoming({ id: 'evt_two', slug: 'two', title: 'Two' });
    const first = await runSync(options(api, [upcoming(), other], emptyIdMap()));
    api.calls = [];
    const second = await runSync(options(api, [upcoming({ status: 'cancelled' }), other], first.idMap));

    expect(api.calls).toEqual([`deleteEvent ${first.idMap.events.evt_show.id}`]);
    expect(second.idMap.events.evt_show).toBeUndefined();

    const feed = JSON.parse(
      buildEventsJson({ events: second.upcoming, idMap: second.idMap, publicUrl: 'https://es.test', schedulePath: 'calendar', now: NOW }),
    );
    expect(feed.events.map((event: CanonicalEvent) => [event.id, event.status])).toEqual(
      expect.arrayContaining([
        ['evt_show', 'cancelled'],
        ['evt_two', 'scheduled'],
      ]),
    );
    expect(Object.keys(feed.calendar.event_pages)).toEqual(['evt_two']);
  });
});

describe('serializeIdMap', () => {
  it('sorts keys so the committed file is stable', () => {
    const map: IdMap = {
      ...emptyIdMap(),
      events: {
        evt_b: { id: '2', url: 'u2', hash: 'h', sub_schedule: null },
        evt_a: { id: '1', url: 'u1', hash: 'h', sub_schedule: null },
      },
    };
    const text = serializeIdMap(map);
    expect(text.indexOf('evt_a')).toBeLessThan(text.indexOf('evt_b'));
    expect(text.endsWith('}\n')).toBe(true);
  });
});

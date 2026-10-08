import { describe, expect, it } from 'vitest';
import { EventScheduleApiError, EventScheduleClient, retryAfterMs } from '../client';

interface Recorded {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

/** A client on a fake clock: sleeping advances time instead of waiting. */
function harness(responses: Array<() => Response>, maxWritesPerMinute?: number) {
  const requests: Recorded[] = [];
  const sleeps: number[] = [];
  let clock = 1_000_000;
  const client = new EventScheduleClient({
    baseUrl: 'https://es.test/',
    apiKey: 'secret-key',
    maxWritesPerMinute,
    now: () => clock,
    sleep: async (ms) => {
      sleeps.push(ms);
      clock += ms;
    },
    fetch: (async (url: string, init: RequestInit) => {
      requests.push({ url, method: init.method!, headers: init.headers as Record<string, string>, body: init.body as string | undefined });
      const next = responses.length > 1 ? responses.shift()! : responses[0];
      return next();
    }) as unknown as typeof fetch,
  });
  return { client, requests, sleeps, advance: (ms: number) => (clock += ms) };
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  () => new Response(JSON.stringify(body), { status, headers });

describe('retryAfterMs', () => {
  it('reads seconds', () => {
    expect(retryAfterMs('17', 0)).toBe(17_000);
  });

  it('reads an HTTP date', () => {
    const now = Date.parse('2026-10-07T12:00:00Z');
    expect(retryAfterMs('Wed, 07 Oct 2026 12:00:30 GMT', now)).toBe(30_000);
  });

  it('waits a full window when the header is missing or unreadable', () => {
    expect(retryAfterMs(null, 0)).toBe(60_000);
    expect(retryAfterMs('soon', 0)).toBe(60_000);
  });
});

describe('EventScheduleClient', () => {
  it('sends the API key and asks for JSON on every request', async () => {
    const { client, requests } = harness([json({ data: { id: 'a' } })]);
    await client.getSchedule('calendar');

    expect(requests[0].url).toBe('https://es.test/api/schedules/calendar');
    expect(requests[0].headers).toMatchObject({ Accept: 'application/json', 'X-API-Key': 'secret-key' });
  });

  it('posts events as JSON to the schedule path', async () => {
    const { client, requests } = harness([json({ data: { id: 'e1', url: 'u', name: 'n', starts_at: 's' } }, 201)]);
    await client.createEvent('calendar', { name: 'n' } as never);

    expect(requests[0]).toMatchObject({ method: 'POST', url: 'https://es.test/api/events/calendar', body: '{"name":"n"}' });
    expect(requests[0].headers['Content-Type']).toBe('application/json');
  });

  it('stays under 20 writes a minute by default, holding the 20th until the first is a minute old', async () => {
    const { client, sleeps } = harness([json({ data: {} })]);
    for (let index = 0; index < 19; index += 1) await client.updateEvent(`e${index}`, {} as never);
    expect(sleeps).toEqual([]);

    await client.updateEvent('e19', {} as never);
    expect(sleeps).toEqual([60_000]);
  });

  it('does not count reads against the write budget', async () => {
    const { client, sleeps } = harness([json({ data: [] })], 2);
    for (let index = 0; index < 10; index += 1) await client.listCategories('calendar');
    expect(sleeps).toEqual([]);
  });

  it('frees write budget as the window moves', async () => {
    const { client, sleeps, advance } = harness([json({ data: {} })], 2);
    await client.updateEvent('a', {} as never);
    advance(40_000);
    await client.updateEvent('b', {} as never);
    await client.updateEvent('c', {} as never);
    expect(sleeps).toEqual([20_000]);
  });

  it('waits out Retry-After on a 429 and tries again', async () => {
    const { client, requests, sleeps } = harness([
      json({ error: 'Rate limit exceeded' }, 429, { 'Retry-After': '23' }),
      json({ data: { id: 'e1' } }),
    ]);
    const result = await client.updateEvent('e1', {} as never);

    expect(result).toEqual({ id: 'e1' });
    expect(sleeps).toEqual([23_000]);
    expect(requests).toHaveLength(2);
  });

  it('gives up on a 429 that never clears', async () => {
    const { client, requests } = harness([json({ error: 'Rate limit exceeded' }, 429, { 'Retry-After': '1' })]);
    await expect(client.getSchedule('calendar')).rejects.toMatchObject({ status: 429 });
    expect(requests).toHaveLength(6);
  });

  it('reports validation errors with their detail and never the API key', async () => {
    const { client } = harness([json({ error: 'Validation failed', errors: { name: ['The name field is required.'] } }, 422)]);
    const error = await client.createEvent('calendar', {} as never).catch((caught) => caught);

    expect(error).toBeInstanceOf(EventScheduleApiError);
    expect(error.message).toBe('POST /events/calendar -> 422: Validation failed {"name":["The name field is required."]}');
    expect(error.message).not.toContain('secret-key');
  });

  it('truncates an HTML error page', async () => {
    const { client } = harness([() => new Response(`<html>${'x'.repeat(5000)}</html>`, { status: 500 })]);
    const error = await client.getSchedule('calendar').catch((caught) => caught);
    expect(error.message.length).toBeLessThan(260);
  });

  it('follows pagination when listing events', async () => {
    const { client, requests } = harness([
      json({ data: [{ id: 'a' }], meta: { last_page: 2 } }),
      json({ data: [{ id: 'b' }], meta: { last_page: 2 } }),
    ]);
    const events = await client.listEvents('calendar');

    expect(events.map((event) => event.id)).toEqual(['a', 'b']);
    expect(requests.map((request) => request.url)).toEqual([
      'https://es.test/api/events?subdomain=calendar&per_page=500&page=1',
      'https://es.test/api/events?subdomain=calendar&per_page=500&page=2',
    ]);
  });

  it('treats deleting an event that is already gone as done', async () => {
    const { client } = harness([json({ error: 'Event not found' }, 404)]);
    await expect(client.deleteEvent('gone')).resolves.toBeUndefined();
  });

  it('creates venues as venue schedules', async () => {
    const { client, requests } = harness([json({ data: { id: 'v1' } }, 201)]);
    await client.createVenue({ name: 'Hall', city: 'Longview', state: 'TX', country_code: 'us', email: 'a@b.test' });
    expect(JSON.parse(requests[0].body!)).toMatchObject({ type: 'venue', name: 'Hall', email: 'a@b.test' });
  });
});

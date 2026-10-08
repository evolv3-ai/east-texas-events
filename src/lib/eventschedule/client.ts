import type { EventScheduleCategory, EventSchedulePayload } from './mapping';

export interface RemoteGroup {
  id: string;
  name: string;
  slug: string;
}

export interface RemoteSchedule {
  id: string;
  subdomain: string;
  url: string;
  type: 'venue' | 'talent' | 'curator';
  name: string;
  email: string | null;
  timezone: string | null;
  groups?: RemoteGroup[];
}

export interface RemoteEvent {
  id: string;
  url: string;
}

export interface VenueBody {
  name: string;
  address1?: string;
  city: string;
  state: string;
  postal_code?: string;
  country_code: string;
  email: string;
}

/** The slice of the Event Schedule REST API the sync uses. */
export interface EventScheduleApi {
  getSchedule(path: string): Promise<RemoteSchedule>;
  listVenues(): Promise<RemoteSchedule[]>;
  createVenue(body: VenueBody): Promise<RemoteSchedule>;
  updateVenue(path: string, body: VenueBody): Promise<RemoteSchedule>;
  createGroup(path: string, name: string): Promise<RemoteGroup>;
  listCategories(path: string): Promise<EventScheduleCategory[]>;
  listEvents(path: string): Promise<RemoteEvent[]>;
  createEvent(path: string, payload: EventSchedulePayload): Promise<RemoteEvent>;
  updateEvent(id: string, payload: EventSchedulePayload): Promise<RemoteEvent>;
  deleteEvent(id: string): Promise<void>;
}

export class EventScheduleApiError extends Error {
  constructor(
    readonly method: string,
    readonly path: string,
    readonly status: number,
    readonly detail: string,
  ) {
    super(`${method} ${path} -> ${status}${detail ? `: ${detail}` : ''}`);
    this.name = 'EventScheduleApiError';
  }
}

export interface ClientOptions {
  baseUrl: string;
  apiKey: string;
  /** Event Schedule allows 30 writes a minute per IP; the sync stays well under it. */
  maxWritesPerMinute?: number;
  maxRetries?: number;
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

const WINDOW_MS = 60_000;
const PAGE_SIZE = 500;
const WRITE_METHODS = new Set(['POST', 'PUT', 'DELETE']);

/** `Retry-After` is either a number of seconds or an HTTP date. */
export function retryAfterMs(header: string | null, now: number): number {
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
    const date = Date.parse(header);
    if (!Number.isNaN(date)) return Math.max(date - now, 0);
  }
  return WINDOW_MS;
}

export class EventScheduleClient implements EventScheduleApi {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly maxWritesPerMinute: number;
  private readonly maxRetries: number;
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly now: () => number;
  private readonly writes: number[] = [];

  constructor(options: ClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.apiKey = options.apiKey;
    this.maxWritesPerMinute = options.maxWritesPerMinute ?? 19;
    this.maxRetries = options.maxRetries ?? 5;
    this.fetchImpl = options.fetch ?? fetch;
    this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.now = options.now ?? Date.now;
  }

  private async throttleWrite(): Promise<void> {
    for (;;) {
      const cutoff = this.now() - WINDOW_MS;
      while (this.writes.length > 0 && this.writes[0] <= cutoff) this.writes.shift();
      if (this.writes.length < this.maxWritesPerMinute) break;
      await this.sleep(this.writes[0] + WINDOW_MS - this.now());
    }
    this.writes.push(this.now());
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json', 'X-API-Key': this.apiKey };
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    for (let attempt = 0; ; attempt += 1) {
      if (WRITE_METHODS.has(method)) await this.throttleWrite();

      const response = await this.fetchImpl(`${this.baseUrl}/api${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      if (response.status === 429 && attempt < this.maxRetries) {
        await this.sleep(retryAfterMs(response.headers.get('retry-after'), this.now()));
        continue;
      }

      const text = await response.text();
      let parsed: unknown;
      try {
        parsed = text ? JSON.parse(text) : undefined;
      } catch {
        parsed = undefined;
      }

      if (!response.ok) throw new EventScheduleApiError(method, path, response.status, errorDetail(parsed, text));
      return parsed as T;
    }
  }

  private async data<T>(method: string, path: string, body?: unknown): Promise<T> {
    return (await this.request<{ data: T }>(method, path, body)).data;
  }

  private async pages<T>(path: string): Promise<T[]> {
    const items: T[] = [];
    for (let page = 1; ; page += 1) {
      const separator = path.includes('?') ? '&' : '?';
      const result = await this.request<{ data: T[]; meta?: { last_page?: number } }>(
        'GET',
        `${path}${separator}per_page=${PAGE_SIZE}&page=${page}`,
      );
      items.push(...result.data);
      if (page >= (result.meta?.last_page ?? 1)) return items;
    }
  }

  getSchedule(path: string) {
    return this.data<RemoteSchedule>('GET', `/schedules/${encodeURIComponent(path)}`);
  }

  listVenues() {
    return this.pages<RemoteSchedule>('/schedules?type=venue');
  }

  createVenue(body: VenueBody) {
    return this.data<RemoteSchedule>('POST', '/schedules', { ...body, type: 'venue' });
  }

  updateVenue(path: string, body: VenueBody) {
    return this.data<RemoteSchedule>('PUT', `/schedules/${encodeURIComponent(path)}`, body);
  }

  createGroup(path: string, name: string) {
    return this.data<RemoteGroup>('POST', `/schedules/${encodeURIComponent(path)}/groups`, { name });
  }

  listCategories(path: string) {
    return this.data<EventScheduleCategory[]>('GET', `/categories/${encodeURIComponent(path)}`);
  }

  listEvents(path: string) {
    return this.pages<RemoteEvent>(`/events?subdomain=${encodeURIComponent(path)}`);
  }

  createEvent(path: string, payload: EventSchedulePayload) {
    return this.data<RemoteEvent>('POST', `/events/${encodeURIComponent(path)}`, payload);
  }

  updateEvent(id: string, payload: EventSchedulePayload) {
    return this.data<RemoteEvent>('PUT', `/events/${encodeURIComponent(id)}`, payload);
  }

  async deleteEvent(id: string): Promise<void> {
    try {
      await this.request('DELETE', `/events/${encodeURIComponent(id)}`);
    } catch (error) {
      // Already gone is the outcome the caller wanted.
      if (error instanceof EventScheduleApiError && error.status === 404) return;
      throw error;
    }
  }
}

function errorDetail(parsed: unknown, text: string): string {
  if (parsed && typeof parsed === 'object') {
    const { error, message, errors } = parsed as { error?: unknown; message?: unknown; errors?: unknown };
    const summary = typeof error === 'string' ? error : typeof message === 'string' ? message : '';
    return errors ? `${summary} ${JSON.stringify(errors)}`.trim() : summary;
  }
  // Without `Accept: application/json` some errors come back as HTML; never echo a whole page.
  return text.replace(/\s+/g, ' ').slice(0, 200);
}

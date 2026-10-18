import { isPublishable } from '../events/data';
import { eventSchema, publicEventsFeedSchema } from '../events/schema';
import { collectFeedErrors } from '../events/validation';
import { idMapSchema } from './sync';
import { buildStaticFiles, STATIC_FILES, type StaticSiteOptions, type StaticFileName } from './static';

export interface PublicationOptions extends StaticSiteOptions {
  allowEmpty?: boolean;
}

/** Validate against the same seed/map snapshot used by sync, never the feed's own count alone. */
export function validatePublication(files: Record<string, string>, options: PublicationOptions): number {
  for (const name of STATIC_FILES) {
    if (!files[name]?.trim()) throw new Error(`Missing public file: ${name}`);
  }
  const feed = publicEventsFeedSchema.parse(JSON.parse(files['events.json']));
  const generated = new Date(feed.generated_at);
  const age = options.now.getTime() - generated.getTime();
  if (!Number.isFinite(age) || age > 48 * 60 * 60 * 1000 || age < -5 * 60 * 1000) {
    throw new Error('Feed timestamp is invalid, stale (>48 hours) or in the future (>5 minutes)');
  }
  if (feed.events.length === 0 && !options.allowEmpty) throw new Error('Empty feed requires explicit --allow-empty acknowledgement');
  const seed = options.events.map(event => eventSchema.parse(event));
  if (new Set(seed.map(event => event.id)).size !== seed.length) throw new Error('Duplicate seed event IDs');
  const events = seed.filter(event => event.moderation.risk_flags.length === 0 && isPublishable(event, generated))
    .sort((a, b) => a.start_at.localeCompare(b.start_at));
  const errors = collectFeedErrors(events, { release: true });
  if (errors.length) throw new Error(`Release gate failed: ${errors.join('; ')}`);
  const idMap = idMapSchema.parse(options.idMap);
  const origin = options.publicUrl.replace(/\/+$/, '');
  if (idMap.base_url !== origin || idMap.schedule !== options.schedulePath) throw new Error('ID map installation/schedule mismatch');
  const remoteIds = new Set<string>();
  for (const event of events) {
    const mapped = idMap.events[event.id];
    if (event.status === 'cancelled') {
      if (mapped) throw new Error(`Cancelled event still mapped: ${event.id}`);
      continue;
    }
    if (!mapped) throw new Error(`Event has not been synchronized into the ID map: ${event.id}`);
    const url = new URL(mapped.url);
    if (url.origin !== origin || !url.pathname.endsWith(`/${mapped.id}`) || url.search || url.hash || remoteIds.has(mapped.id)) {
      throw new Error(`Invalid or duplicate synchronized page mapping: ${event.id}`);
    }
    remoteIds.add(mapped.id);
  }
  const expected = buildStaticFiles({ ...options, events, idMap, now: generated });
  for (const name of STATIC_FILES) {
    if (files[name] !== expected[name]) throw new Error(`${name} differs from the synchronized seed/map snapshot`);
  }
  return events.length;
}

const CONTENT_TYPES: Record<StaticFileName, string[]> = {
  'events.json': ['application/json'],
  'openapi.json': ['application/json'],
  'llms.txt': ['text/plain'],
  'sitemap-index.xml': ['application/xml', 'text/xml'],
};

/** Ordinary public URLs (no cache-busting query), no credentials, no redirect fallthrough. */
export async function verifyPublishedFiles(baseUrl: string, files: Record<string, string>, get: typeof fetch = fetch): Promise<void> {
  for (const name of STATIC_FILES) {
    const response = await get(`${baseUrl.replace(/\/+$/, '')}/${name}`, {
      redirect: 'error', signal: AbortSignal.timeout(15_000), headers: { 'Cache-Control': 'no-cache' },
    });
    const type = response.headers.get('content-type')?.split(';')[0].trim();
    if (response.status !== 200 || !CONTENT_TYPES[name].includes(type ?? '') || response.headers.get('access-control-allow-origin') !== '*') {
      throw new Error(`${name}: expected HTTP 200, correct content type and public CORS; got ${response.status} ${type}`);
    }
    if (await response.text() !== files[name]) throw new Error(`${name}: published bytes differ from the validated release`);
  }
}

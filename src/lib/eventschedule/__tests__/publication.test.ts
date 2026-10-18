import { describe, expect, it } from 'vitest';
import { makeEvent } from '../../events/__tests__/factories';
import { buildStaticFiles } from '../static';
import { emptyIdMap } from '../sync';
import * as publication from '../publication';

const now = new Date('2026-10-09T12:00:00Z');
const events = [makeEvent()];
const idMap = { ...emptyIdMap(), base_url: 'https://e-tex.events', schedule: 'calendar',
  events: { evt_test: { id: 'remote1', url: 'https://e-tex.events/venue/test/remote1', hash: 'h', sub_schedule: null } } };
const options = { events, idMap, publicUrl: 'https://e-tex.events', schedulePath: 'calendar', now };
const files = () => buildStaticFiles(options);
const validate = (bundle = files(), overrides = {}) => publication.validatePublication(bundle, { ...options, ...overrides });

describe('publication gate', () => {
  it('accepts a complete synchronized bundle', () => expect(validate()).toBe(1));
  it.each(['events.json', 'llms.txt', 'openapi.json', 'sitemap-index.xml'] as const)('rejects missing %s', name => {
    const bundle = files(); delete (bundle as Partial<typeof bundle>)[name];
    expect(() => validate(bundle)).toThrow();
  });
  it('rejects an empty feed even if its counts match', () => {
    const empty = buildStaticFiles({ ...options, events: [] });
    expect(() => validate(empty, { events: [] })).toThrow(/empty/i);
    expect(validate(empty, { events: [], allowEmpty: true })).toBe(0);
  });
  it('does not let allowEmpty hide omitted seed events', () => {
    expect(() => validate(buildStaticFiles({ ...options, events: [] }), { allowEmpty: true })).toThrow();
  });
  it('rejects stale and future timestamps', () => {
    for (const date of ['2026-10-06T12:00:00Z', '2026-10-09T12:06:00Z']) {
      expect(() => validate(buildStaticFiles({ ...options, now: new Date(date) }))).toThrow(/time|stale|future/i);
    }
  });
  it('rejects a page mapping missing from a synchronized event', () => {
    expect(() => validate(files(), { idMap: { ...idMap, events: {} } })).toThrow(/map|synchron/i);
  });
  it('rejects incorrect counts, content, event URLs and placeholders', () => {
    for (const change of [
      (f: ReturnType<typeof files>) => { const j = JSON.parse(f['events.json']); j.event_count = 2; f['events.json'] = JSON.stringify(j); },
      (f: ReturnType<typeof files>) => { f['llms.txt'] = '# East Texas Events\nplaceholder'; },
      (f: ReturnType<typeof files>) => { f['events.json'] = f['events.json'].replace('Test Event', 'Wrong Event'); },
      (f: ReturnType<typeof files>) => { f['events.json'] = f['events.json'].replace('/venue/test/', '/wrong/test/'); },
    ]) { const f = files(); change(f); expect(() => validate(f)).toThrow(); }
  });
  it('rejects an ID map for a different installation', () => {
    expect(() => validate(files(), { idMap: { ...idMap, base_url: 'https://other.example' } })).toThrow();
  });
  it('retains cancellations without requiring a deleted event page', () => {
    const cancelled = [makeEvent({ status: 'cancelled' })];
    const map = { ...idMap, events: {} };
    expect(validate(buildStaticFiles({ ...options, events: cancelled, idMap: map }), { events: cancelled, idMap: map })).toBe(1);
  });
  it('excludes past and unapproved seed events without requiring them in JSON', () => {
    expect(validate(files(), { events: [...events, makeEvent({ id: 'old', status: 'past' }), makeEvent({ id: 'pending', moderation: { status: 'needs_review', risk_flags: [] } })] })).toBe(1);
  });
});

describe('public HTTP verification', () => {
  const response = (name: string, content: string, overrides: Record<string, string> = {}) => new Response(content, {
    headers: { 'content-type': name.endsWith('.json') ? 'application/json' : name.endsWith('.xml') ? 'application/xml' : 'text/plain', 'access-control-allow-origin': '*', ...overrides },
  });
  it('checks the actual bytes of all four public files', async () => {
    const bundle = files();
    const get = async (url: string | URL | Request) => { const name = new URL(String(url)).pathname.slice(1) as keyof typeof bundle; return response(name, bundle[name]); };
    await expect(publication.verifyPublishedFiles(options.publicUrl, bundle, get as typeof fetch)).resolves.toBeUndefined();
  });
  it.each(['html', 'cors', 'body', '404'])('rejects %s responses', async mode => {
    const get = async () => mode === '404' ? new Response('missing', { status: 404 }) : response('events.json', mode === 'body' ? '{}' : files()['events.json'], mode === 'html' ? { 'content-type': 'text/html' } : mode === 'cors' ? { 'access-control-allow-origin': '' } : {});
    await expect(publication.verifyPublishedFiles(options.publicUrl, files(), get as typeof fetch)).rejects.toThrow();
  });
});

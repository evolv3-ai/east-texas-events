import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { browseSlug } from '../browse';
import type { PublicEventsFeed } from '../schema';

let output: string;
let feed: PublicEventsFeed;
const read = (path: string) => readFile(join(output, path), 'utf8');
const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

beforeAll(async () => {
  output = await mkdtemp(join(tmpdir(), 'etex-browse-'));
  await promisify(execFile)(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build'], {
    env: { ...process.env, ASTRO_OUT_DIR: output, VITE_CACHE_DIR: join(output, '.vite') },
    maxBuffer: 4 * 1024 * 1024,
  });
  feed = JSON.parse(await read('events.json'));
}, 60000);

afterAll(async () => { if (output) await rm(output, { recursive: true, force: true }); });

describe('generated browse HTML and sitemap', () => {
  it.each(['cities', 'categories'] as const)('publishes linked %s pages containing only matching feed events', async kind => {
    const names = feed.filters[kind];
    const index = await read(`events/${kind}/index.html`);
    expect(index).toContain('<meta name="description"');
    expect(index).toContain(kind === 'cities' ? 'Browse East Texas events by city' : 'Browse East Texas events by category');
    const sitemap = await read('sitemap.xml');
    expect(sitemap).toContain(`https://events.shallowcreek.com/events/${kind}/`);
    const children = (await readdir(join(output, 'events', kind), { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
    expect(children).toEqual(names.map(browseSlug).sort());
    for (const name of names) {
      const path = `/events/${kind}/${browseSlug(name)}/`;
      expect(index).toContain(`href="${path}"`);
      expect(sitemap).toContain(`https://events.shallowcreek.com${path}`);
      const html = await read(`${path.slice(1)}index.html`);
      expect(html).toContain(escapeHtml(name));
      expect(html).toContain('<title>');
      expect(html).toContain('<meta name="description"');
      for (const event of feed.events) {
        const matching = kind === 'cities' ? event.location.city === name : event.categories.includes(name);
        if (matching) expect(html).toContain(`href="/events/${event.slug}/"`);
        else expect(html).not.toContain(`href="/events/${event.slug}/"`);
      }
    }
  });

  it('links both indexes from existing navigation and preserves event detail routes', async () => {
    const home = await read('events/index.html');
    expect(home).toContain('href="/events/cities/"');
    expect(home).toContain('href="/events/categories/"');
    for (const event of feed.events) expect(await read(`events/${event.slug}/index.html`)).toContain(escapeHtml(event.title));
  });
});

it('builds helpful empty indexes without detail pages or stale sitemap entries', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'etex-empty-browse-'));
  const output = join(scratch, 'site');
  const clock = join(scratch, 'clock.mjs');
  try {
    await writeFile(clock, `const OriginalDate = Date;
      globalThis.Date = class extends OriginalDate {
        constructor(...args) { super(...(args.length ? args : ['2100-01-01T00:00:00Z'])); }
        static now() { return new OriginalDate('2100-01-01T00:00:00Z').valueOf(); }
      };`);
    await promisify(execFile)(process.execPath, ['--import', clock, 'node_modules/astro/bin/astro.mjs', 'build'], {
      env: { ...process.env, ASTRO_OUT_DIR: output, VITE_CACHE_DIR: join(scratch, 'cache') },
      maxBuffer: 4 * 1024 * 1024,
    });
    const feed = JSON.parse(await readFile(join(output, 'events.json'), 'utf8'));
    expect(feed.events).toEqual([]);
    const sitemap = await readFile(join(output, 'sitemap.xml'), 'utf8');
    for (const kind of ['cities', 'categories']) {
      expect(await readdir(join(output, 'events', kind))).toEqual(['index.html']);
      const html = await readFile(join(output, 'events', kind, 'index.html'), 'utf8');
      expect(html).toContain('No upcoming events are currently listed.');
      expect(html).toContain('href="/events/"');
      expect(sitemap).toContain(`https://events.shallowcreek.com/events/${kind}/`);
    }
    expect((sitemap.match(/<url>/g) ?? []).length).toBe(4);
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}, 60000);

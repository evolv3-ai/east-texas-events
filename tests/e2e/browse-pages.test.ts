import { beforeAll, describe, expect, it } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { browseLabel, browseSlug } from '@/lib/events/browse';
import type { PublicEventsFeed } from '@/lib/events/schema';

const output = resolve(process.env.ASTRO_OUT_DIR ?? 'dist');
let feed: PublicEventsFeed;
const read = (path: string) => readFile(join(output, path), 'utf8');
const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

beforeAll(async () => {
  feed = JSON.parse(await read('events.json'));
});

describe('built browse HTML', () => {
  it.each(['cities', 'categories'] as const)('publishes linked %s pages containing only matching feed events', async kind => {
    const names = feed.filters[kind];
    const index = await read(`events/${kind}/index.html`);
    expect(index).toContain('<meta name="description"');
    expect(index).toContain(kind === 'cities' ? 'Browse East Texas events by city' : 'Browse East Texas events by category');
    const children = (await readdir(join(output, 'events', kind), { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
    expect(children).toEqual(names.map(browseSlug).sort());
    for (const name of names) {
      const path = `/events/${kind}/${browseSlug(name)}/`;
      const label = escapeHtml(browseLabel(kind, name));
      expect(index).toContain(`href="${path}">${label}</a>`);
      const html = await read(`${path.slice(1)}index.html`);
      expect(html.match(/<h1>([^<]*)<\/h1>/)?.[1]).toContain(label);
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

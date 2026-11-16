import { describe, expect, it } from 'vitest';
import { getBrowseGroups, getBrowsePaths, browseSlug } from '../browse';
import { getApprovedEvents } from '../data';

const NOW = new Date('2026-11-15T12:00:00Z');

describe('browseSlug', () => {
  it.each([
    ['New London', 'new-london'],
    ['Arts & Crafts', 'arts-crafts'],
    ["St. Mary's", 'st-marys'],
    ['  Food / Drink! ', 'food-drink'],
    ['Café Music', 'cafe-music'],
  ])('turns %s into a stable URL segment', (name, slug) => {
    expect(browseSlug(name)).toBe(slug);
  });
});

describe('browse page generation', () => {
  it.each(['cities', 'categories'] as const)('generates exactly the populated %s from approved upcoming data', (kind) => {
    const events = getApprovedEvents(NOW);
    const groups = getBrowseGroups(kind, NOW);
    const names = [...new Set(events.flatMap(event => kind === 'cities' ? [event.location.city] : event.categories))].sort();
    expect(groups.map(group => group.name)).toEqual(names);
    for (const group of groups) {
      expect(group.events).toEqual(events.filter(event => kind === 'cities' ? event.location.city === group.name : event.categories.includes(group.name)));
      expect(group.events.length).toBeGreaterThan(0);
    }
    expect(getBrowsePaths(kind, NOW)).toEqual(groups.map(group => ({ params: { slug: group.slug }, props: { group } })));
  });

  it('omits all detail pages after the events expire', () => {
    const future = new Date('2100-01-01T00:00:00Z');
    expect(getBrowsePaths('cities', future)).toEqual([]);
    expect(getBrowsePaths('categories', future)).toEqual([]);
  });
});

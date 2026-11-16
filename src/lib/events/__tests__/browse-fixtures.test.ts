import { describe, expect, it, vi } from 'vitest';

vi.mock('@/data/events.seed.json', async () => {
  const { makeEvent } = await import('./factories');
  const event = (id: string, overrides = {}) => makeEvent({ id, slug: id, ...overrides });
  return { default: [
    event('later', { start_at: '2099-06-01T12:00:00Z', categories: ['Arts & Crafts', 'Food / Drink!'] }),
    event('earlier', { start_at: '2099-05-01T12:00:00Z', location: { city: 'New London' }, categories: ['Arts & Crafts', 'Arts & Crafts'] }),
    event('ended', { start_at: '2000-01-01T12:00:00Z', categories: ['Expired'] }),
    event('pending', { moderation: { status: 'pending' }, categories: ['Pending'] }),
    event('past', { status: 'past', categories: ['Past'] }),
    event('ongoing', { start_at: '2000-01-01T12:00:00Z', end_at: '2099-07-01T12:00:00Z', categories: ['Ongoing'] }),
  ] };
});

import { getBrowseGroups, getBrowsePaths } from '../browse';
const NOW = new Date('2099-04-01T12:00:00Z');

describe('browse groups from validated seed fixtures', () => {
  it('preserves multi-word city names and emits hyphenated paths', () => {
    const paths = getBrowsePaths('cities', NOW);
    expect(paths.map(path => path.params.slug)).toEqual(['kilgore', 'new-london']);
    expect(paths[1].props.group.name).toBe('New London');
    expect(paths[1].props.group.events.map(event => event.id)).toEqual(['earlier']);
  });

  it('preserves category labels, shares events across categories, and avoids duplicate membership', () => {
    const groups = getBrowseGroups('categories', NOW);
    expect(groups.map(group => [group.name, group.slug, group.events.map(event => event.id)])).toEqual([
      ['Arts & Crafts', 'arts-crafts', ['earlier', 'later']],
      ['Food / Drink!', 'food-drink', ['later']],
      ['Ongoing', 'ongoing', ['ongoing']],
    ]);
  });

  it('drops expired, unapproved, and explicitly past groups while retaining ongoing events', () => {
    expect(getBrowseGroups('cities', NOW)[0].events.map(event => event.id)).toEqual(['ongoing', 'later']);
  });
});

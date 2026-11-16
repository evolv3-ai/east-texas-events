import { getApprovedEvents } from './data';
import type { CanonicalEvent } from './schema';

export type BrowseKind = 'cities' | 'categories';
export interface BrowseGroup {
  name: string;
  label: string;
  slug: string;
  events: CanonicalEvent[];
}

const CATEGORY_LABELS: Record<string, string> = { 'food-drink': 'Food & Drink' };

export function browseSlug(name: string): string {
  const slug = name.normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) throw new Error(`Browse name has no URL-safe characters: ${JSON.stringify(name)}`);
  return slug;
}

export function browseLabel(kind: BrowseKind, name: string): string {
  if (kind === 'cities') return name;
  return CATEGORY_LABELS[name] ?? name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function getBrowseGroups(kind: BrowseKind, now: Date = new Date()): BrowseGroup[] {
  const groups = new Map<string, CanonicalEvent[]>();
  for (const event of getApprovedEvents(now)) {
    const names = kind === 'cities' ? [event.location.city] : event.categories;
    for (const name of new Set(names)) {
      const events = groups.get(name) ?? [];
      events.push(event);
      groups.set(name, events);
    }
  }
  const slugs = new Set<string>();
  return [...groups.keys()].sort().map(name => {
    const slug = browseSlug(name);
    // Fail explicitly rather than silently overwrite a different field value's page.
    if (slugs.has(slug)) throw new Error(`Duplicate ${kind} browse slug: ${slug}`);
    slugs.add(slug);
    return { name, label: browseLabel(kind, name), slug, events: groups.get(name)! };
  });
}

export function getBrowsePaths(kind: BrowseKind, now: Date = new Date()) {
  return getBrowseGroups(kind, now).map(group => ({ params: { slug: group.slug }, props: { group } }));
}

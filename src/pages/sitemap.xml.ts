import type { APIRoute } from 'astro';
import { getApprovedEvents } from '@/lib/events/data';
import { getBrowseGroups } from '@/lib/events/browse';

export const GET: APIRoute = ({ site }) => {
  const now = new Date();
  const paths = [
    '/events/',
    '/events/near-shallow-creek-rv-park/',
    '/events/cities/',
    '/events/categories/',
    ...getApprovedEvents(now).map(event => `/events/${event.slug}/`),
    ...(['cities', 'categories'] as const).flatMap(kind =>
      getBrowseGroups(kind, now).map(group => `/events/${kind}/${group.slug}/`)),
  ];
  const urls = paths.map(path => `<url><loc>${new URL(path, site).href}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};

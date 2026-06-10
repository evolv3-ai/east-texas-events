import type { PublicEventsFeed } from './schema';

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function rfc822(iso: string): string {
  return new Date(iso).toUTCString();
}

export function eventsToRss(feed: PublicEventsFeed, site: string): string {
  const items = feed.events
    .map((event) => {
      const link = `${site}/events/${event.slug}/`;
      const descriptionParts = [
        event.agent_summary,
        `Starts: ${event.start_at} (${event.timezone})`,
        [event.location.name, event.location.city, event.location.region]
          .filter(Boolean)
          .join(', '),
      ].filter(Boolean);
      return [
        '    <item>',
        `      <title>${xmlEscape(event.title)}</title>`,
        `      <link>${link}</link>`,
        `      <guid isPermaLink="true">${link}</guid>`,
        `      <pubDate>${rfc822(event.updated_at)}</pubDate>`,
        `      <description>${xmlEscape(descriptionParts.join(' — '))}</description>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>East Texas Events</title>',
    `    <link>${site}/events/</link>`,
    `    <atom:link href="${site}/events.rss.xml" rel="self" type="application/rss+xml"/>`,
    '    <description>Curated, source-verified events near Shallow Creek RV Park in East Texas.</description>',
    '    <language>en-us</language>',
    `    <lastBuildDate>${rfc822(feed.generated_at)}</lastBuildDate>`,
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

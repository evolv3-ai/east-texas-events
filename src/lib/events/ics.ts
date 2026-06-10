import type { PublicEventsFeed } from './schema';

function icsEscape(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function toIcsUtc(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// RFC 5545 §3.1: content lines should not exceed 75 octets; continuation
// lines begin with a single space.
function fold(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    chunks.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  if (rest) chunks.push(` ${rest}`);
  return chunks.join('\r\n');
}

export function eventsToIcs(feed: PublicEventsFeed, site: string): string {
  const host = new URL(site).host;
  const dtstamp = toIcsUtc(feed.generated_at);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//East Texas Events//${host}//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const event of feed.events) {
    const location = [event.location.name, event.location.city, event.location.region]
      .filter(Boolean)
      .join(', ');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@${host}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${toIcsUtc(event.start_at)}`,
    );
    if (event.end_at) lines.push(`DTEND:${toIcsUtc(event.end_at)}`);
    lines.push(
      `SUMMARY:${icsEscape(event.title)}`,
      `DESCRIPTION:${icsEscape(event.agent_summary)}`,
      `LOCATION:${icsEscape(location)}`,
      `URL:${site}/events/${event.slug}/`,
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

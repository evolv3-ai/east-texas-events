import { getEventsFeed } from '@/lib/events/data';

export function GET() {
  const feed = getEventsFeed();
  const body = [
    '# East Texas Events',
    '',
    '> Agent-readable event guide launching first on ShallowCreek.com.',
    '',
    `Generated: ${feed.generated_at}`,
    `Schema version: ${feed.schema_version}`,
    '',
    '## Machine-readable surfaces',
    '',
    '- JSON feed: /events.json',
    '- RSS feed: /events.rss.xml',
    '- iCalendar feed: /events.ics',
    '- OpenAPI description: /openapi.json',
    '- Human index: /events/',
    '- Nearby events: /events/near-shallow-creek-rv-park/',
    '',
    '## Usage guidance for agents',
    '',
    '- Prefer /events.json for structured extraction.',
    '- Use event source_url fields for verification and citations.',
    '- Treat seed-fixture risk flags as not-yet-production verified.',
    '- Dates are ISO-8601 with America/Chicago timezone context.',
    '- Do not infer cancellation, pricing, or ticket availability beyond explicit fields.',
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}

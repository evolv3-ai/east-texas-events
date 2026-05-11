import { getEventsFeed } from '../src/lib/events/data';
import { publicEventsFeedSchema } from '../src/lib/events/schema';

const jsonMode = process.argv.includes('--json');
const errors: string[] = [];

try {
  const feed = publicEventsFeedSchema.parse(getEventsFeed());
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (const event of feed.events) {
    if (ids.has(event.id)) errors.push(`duplicate id: ${event.id}`);
    ids.add(event.id);
    if (slugs.has(event.slug)) errors.push(`duplicate slug: ${event.slug}`);
    slugs.add(event.slug);
    if (!event.links.source_url) errors.push(`${event.id}: missing source_url`);
    if (!event.agent_summary) errors.push(`${event.id}: missing agent_summary`);
    if (event.moderation.status === 'approved' && event.source.confidence < 0.5) {
      errors.push(`${event.id}: approved event has low confidence`);
    }
  }

  const result = {
    ok: errors.length === 0,
    schema_version: feed.schema_version,
    event_count: feed.event_count,
    source_count: feed.source_count,
    errors,
  };

  if (jsonMode) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`events validation: ${result.ok ? 'PASS' : 'FAIL'}`);
    console.log(`events: ${feed.event_count}; sources: ${feed.source_count}; schema: ${feed.schema_version}`);
    for (const error of errors) console.error(`- ${error}`);
  }

  process.exit(errors.length === 0 ? 0 : 1);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (jsonMode) console.log(JSON.stringify({ ok: false, errors: [message] }, null, 2));
  else console.error(message);
  process.exit(1);
}

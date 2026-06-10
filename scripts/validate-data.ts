import { getEventsFeed } from '../src/lib/events/data';
import { publicEventsFeedSchema } from '../src/lib/events/schema';
import { collectFeedErrors } from '../src/lib/events/validation';

const jsonMode = process.argv.includes('--json');
const releaseMode = process.argv.includes('--release');

try {
  const feed = publicEventsFeedSchema.parse(getEventsFeed());
  const errors = collectFeedErrors(feed.events, { release: releaseMode });

  const result = {
    ok: errors.length === 0,
    schema_version: feed.schema_version,
    event_count: feed.event_count,
    source_count: feed.source_count,
    release_mode: releaseMode,
    errors,
  };

  if (jsonMode) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`events validation: ${result.ok ? 'PASS' : 'FAIL'}${releaseMode ? ' (release mode)' : ''}`);
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

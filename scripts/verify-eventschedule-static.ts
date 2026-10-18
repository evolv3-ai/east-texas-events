import { readFileSync } from 'node:fs';
import path from 'node:path';
import rawEvents from '../src/data/events.seed.json';
import { eventSchema } from '../src/lib/events/schema';
import { idMapSchema } from '../src/lib/eventschedule/sync';
import { STATIC_FILES } from '../src/lib/eventschedule/static';
import { validatePublication, verifyPublishedFiles } from '../src/lib/eventschedule/publication';

import { validateSyncEvidence } from '../src/lib/eventschedule/sync-evidence';

const args = process.argv.slice(2);
const directory = args.find(arg => !arg.startsWith('--')) ?? 'dist-eventschedule';
const publicUrl = process.env.ES_BASE_URL?.replace(/\/+$/, '');
try {
  if (!publicUrl) throw new Error('ES_BASE_URL is required');
  const files = Object.fromEntries(STATIC_FILES.map(name => [name, readFileSync(path.join(directory, name), 'utf8')]));
  const count = validatePublication(files, {
    events: rawEvents.map(event => eventSchema.parse(event)),
    idMap: idMapSchema.parse(JSON.parse(readFileSync('src/data/eventschedule-ids.json', 'utf8'))),
    publicUrl, schedulePath: 'calendar', now: new Date(), allowEmpty: args.includes('--allow-empty'),
  });
  if (process.env.ES_SYNC_REPORT) validateSyncEvidence(JSON.parse(readFileSync(process.env.ES_SYNC_REPORT, 'utf8')), JSON.parse(files['events.json']));
  if (args.includes('--public')) await verifyPublishedFiles(publicUrl, files);
  console.log(`Validated ${STATIC_FILES.length} ${args.includes('--public') ? 'published' : 'local'} files; ${count} events match the synchronized seed/map.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

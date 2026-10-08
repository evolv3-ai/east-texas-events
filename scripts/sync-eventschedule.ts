import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import rawEvents from '../src/data/events.seed.json';
import { eventSchema } from '../src/lib/events/schema';
import { EventScheduleClient } from '../src/lib/eventschedule/client';
import { buildStaticFiles } from '../src/lib/eventschedule/static';
import { emptyIdMap, idMapSchema, runSync, serializeIdMap, type IdMap, type SyncReport } from '../src/lib/eventschedule/sync';

const SCHEDULE_PATH = 'calendar';
const ID_MAP_FILE = 'src/data/eventschedule-ids.json';
const OUT_DIR = 'dist-eventschedule';

const USAGE = `Usage: tsx scripts/sync-eventschedule.ts [options]

One-way sync of approved, flag-free seed events to an Event Schedule install.

Options:
  --dry-run          Report what would change; write nothing anywhere
  --json             Print the report as JSON
  --archive          Also sync past events (off by default)
  --help             Show this help

Environment:
  ES_BASE_URL        Origin of the install, for example https://e-tex.events
  ES_API_KEY         API key of the account that owns the curator schedule
  ES_CONTACT_EMAIL   Email set on venue schedules (default: the curator schedule's)

The curator schedule is "${SCHEDULE_PATH}", the ID map is ${ID_MAP_FILE}, and events.json,
llms.txt, openapi.json and sitemap-index.xml are written to ${OUT_DIR}/.
A dry run without ES_BASE_URL and ES_API_KEY plans from the ID map alone.`;

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);

const jsonMode = flag('--json');

function fail(reason: string, code = 1): never {
  if (jsonMode) console.log(JSON.stringify({ ok: false, errors: [reason] }, null, 2));
  else console.error(reason);
  process.exit(code);
}

function printReport(report: SyncReport, written: string[]): void {
  const mode = report.dry_run ? (report.remote_checked ? 'dry run' : 'dry run, offline') : 'live';
  console.log(`eventschedule sync: ${report.ok ? 'OK' : 'FAILED'} (${mode}${report.archive ? ', archive' : ''}; schedule "${report.schedule}")`);
  console.log(
    `events: ${report.counts.create} create, ${report.counts.update} update, ${report.counts.unchanged} unchanged, ` +
      `${report.counts.delete} delete, ${report.counts.skip} skip, ${report.counts.error} error`,
  );
  for (const venue of report.venues) {
    if (venue.action !== 'unchanged') console.log(`  venue ${venue.action}: ${venue.name}${venue.subdomain ? ` (/${venue.subdomain})` : ''}`);
  }
  for (const event of report.events) {
    if (event.action === 'unchanged') continue;
    const detail = [event.url, event.reason].filter(Boolean).join(' - ');
    console.log(`  ${event.action}: ${event.event_id}${detail ? ` (${detail})` : ''}`);
  }
  for (const warning of report.warnings) console.warn(`warning: ${warning}`);
  for (const error of report.errors) console.error(`error: ${error}`);
  for (const file of written) console.log(`wrote ${file}`);
}

async function main(): Promise<void> {
  if (flag('--help')) {
    console.log(USAGE);
    return;
  }

  const dryRun = flag('--dry-run');
  const baseUrl = process.env.ES_BASE_URL?.replace(/\/+$/, '') || null;
  const apiKey = process.env.ES_API_KEY || null;
  const idMapFile = path.resolve(ID_MAP_FILE);
  const outDir = path.resolve(OUT_DIR);

  if (!dryRun && !(baseUrl && apiKey)) {
    fail('ES_BASE_URL and ES_API_KEY are required for a live sync (use --dry-run to plan without them)', 2);
  }

  const events = rawEvents.map((event) => eventSchema.parse(event));
  const idMap = existsSync(idMapFile) ? idMapSchema.parse(JSON.parse(readFileSync(idMapFile, 'utf8'))) : emptyIdMap();
  const api = baseUrl && apiKey ? new EventScheduleClient({ baseUrl, apiKey }) : undefined;
  const now = new Date();

  // Saved after every write, not once at the end: every ID in it names something that now
  // exists, and a run that is cut short must not leave any of them unrecorded.
  let idMapWritten = false;
  const saveIdMap = (map: IdMap) => {
    const serialized = serializeIdMap(map);
    if (existsSync(idMapFile) && readFileSync(idMapFile, 'utf8') === serialized) return;
    writeFileSync(idMapFile, serialized);
    idMapWritten = true;
  };

  const result = await runSync({
    events,
    idMap,
    api,
    baseUrl,
    schedulePath: SCHEDULE_PATH,
    contactEmail: process.env.ES_CONTACT_EMAIL || undefined,
    now,
    archive: flag('--archive'),
    dryRun,
    saveIdMap,
  });

  const written: string[] = [];
  if (!dryRun) {
    saveIdMap(result.idMap);
    if (idMapWritten) written.push(path.relative(process.cwd(), idMapFile));

    const files = buildStaticFiles({
      events: result.upcoming,
      idMap: result.idMap,
      publicUrl: baseUrl!,
      schedulePath: SCHEDULE_PATH,
      now,
    });
    mkdirSync(outDir, { recursive: true });
    for (const [name, content] of Object.entries(files)) {
      writeFileSync(path.join(outDir, name), content);
      written.push(path.relative(process.cwd(), path.join(outDir, name)));
    }
  }

  if (jsonMode) console.log(JSON.stringify({ ...result.report, written }, null, 2));
  else printReport(result.report, written);
  process.exit(result.report.ok ? 0 : 1);
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));

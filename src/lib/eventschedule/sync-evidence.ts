import type { SyncReport } from './sync';

/** The ID map is history; require this run's successful remote check as well. */
export function validateSyncEvidence(report: SyncReport, feed: { events: { id: string; status: string }[]; calendar: { event_pages: Record<string, string> } }): void {
  if (report.ok !== true || report.dry_run !== false || report.remote_checked !== true || !Array.isArray(report.errors) || report.errors.length || !Array.isArray(report.events)) {
    throw new Error('Publication requires a successful live synchronization report');
  }
  for (const event of feed.events) {
    if (event.status === 'cancelled') continue;
    const results = report.events.filter(result => result.event_id === event.id);
    const result = results[0];
    if (results.length !== 1 || !['create', 'update', 'unchanged'].includes(result.action) || !result.es_id || result.url !== feed.calendar.event_pages[event.id]) {
      throw new Error(`Published event differs from successful synchronization: ${event.id}`);
    }
  }
}

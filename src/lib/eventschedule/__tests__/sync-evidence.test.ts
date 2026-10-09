import { expect, it } from 'vitest';
import type { SyncReport } from '../sync';
import { validateSyncEvidence } from '../sync-evidence';
const feed = { events: [{ id: 'evt_a', status: 'scheduled' }], calendar: { event_pages: { evt_a: 'https://e-tex.events/v/e/r1' } } };
const report: SyncReport = { archive: false, schedule: 'calendar', counts: { create: 0, update: 0, unchanged: 1, delete: 0, skip: 0, error: 0 }, venues: [], warnings: [], ok: true, dry_run: false, remote_checked: true, errors: [], events: [{ event_id: 'evt_a', title: 'Event A', action: 'unchanged', es_id: 'r1', url: feed.calendar.event_pages.evt_a }] };
it('requires successful remote sync evidence for every published active event', () => {
  expect(() => validateSyncEvidence(report, feed)).not.toThrow();
  for (const changed of [{ ...report, ok: false }, { ...report, dry_run: true }, { ...report, remote_checked: false }, { ...report, events: [] }, { ...report, errors: ['failed'] }, { ...report, events: [{ ...report.events[0], url: 'https://wrong.example' }] }]) {
    expect(() => validateSyncEvidence(changed, feed)).toThrow();
  }
});

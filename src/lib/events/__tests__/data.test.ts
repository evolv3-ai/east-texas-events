import { describe, expect, it } from 'vitest';
import { formatEventDate, getApprovedEvents, isPublishable } from '../data';
import { makeEvent } from './factories';

const NOW = new Date('2026-06-08T12:00:00Z');
const FUTURE_ISO = '2099-12-31T00:00:00-05:00';
const PAST_ISO = '2000-01-01T00:00:00-05:00';

describe('isPublishable', () => {
  it('publishes approved scheduled future events', () => {
    expect(isPublishable(makeEvent({ start_at: FUTURE_ISO }), NOW)).toBe(true);
  });

  it('excludes pending-moderation events', () => {
    expect(
      isPublishable(
        makeEvent({ start_at: FUTURE_ISO, moderation: { status: 'pending', risk_flags: [] } }),
        NOW,
      ),
    ).toBe(false);
  });

  it('excludes status=past events even with future dates', () => {
    expect(isPublishable(makeEvent({ status: 'past', start_at: FUTURE_ISO }), NOW)).toBe(false);
  });

  it('excludes events whose end_at is before now', () => {
    expect(isPublishable(makeEvent({ start_at: PAST_ISO, end_at: PAST_ISO }), NOW)).toBe(false);
  });

  it('uses start_at when end_at is absent', () => {
    expect(isPublishable(makeEvent({ start_at: PAST_ISO }), NOW)).toBe(false);
  });

  it('keeps cancelled events visible', () => {
    expect(isPublishable(makeEvent({ status: 'cancelled', start_at: FUTURE_ISO }), NOW)).toBe(true);
  });

  it('keeps postponed events visible', () => {
    expect(isPublishable(makeEvent({ status: 'postponed', start_at: FUTURE_ISO }), NOW)).toBe(true);
  });
});

describe('formatEventDate', () => {
  it('formats a single-day event as one date with time', () => {
    const event = makeEvent({ start_at: '2026-06-20T19:00:00-05:00', end_at: '2026-06-20T23:59:00-05:00' });
    expect(formatEventDate(event)).toBe('Jun 20, 2026, 7:00 PM');
  });

  it('formats a multi-day event as a date range', () => {
    const event = makeEvent({ start_at: '2026-06-11T18:00:00-05:00', end_at: '2026-06-13T23:30:00-05:00' });
    expect(formatEventDate(event)).toBe('Jun 11, 2026, 6:00 PM – Jun 13, 2026');
  });

  it('formats an event without end_at as one date with time', () => {
    const event = makeEvent({ start_at: '2026-08-30T19:00:00-05:00' });
    expect(formatEventDate(event)).toBe('Aug 30, 2026, 7:00 PM');
  });
});

describe('getApprovedEvents', () => {
  it('returns events from the seed when now is well in the past', () => {
    expect(getApprovedEvents(new Date('2025-01-01T00:00:00Z')).length).toBeGreaterThan(0);
  });

  it('returns empty when now is well in the future', () => {
    expect(getApprovedEvents(new Date('2100-01-01T00:00:00Z'))).toHaveLength(0);
  });
});

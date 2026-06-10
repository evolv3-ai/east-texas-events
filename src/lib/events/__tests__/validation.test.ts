import { describe, expect, it } from 'vitest';
import { collectFeedErrors } from '../validation';
import { makeEvent } from './factories';

describe('collectFeedErrors', () => {
  it('returns no errors for a clean feed', () => {
    expect(collectFeedErrors([makeEvent()])).toEqual([]);
  });

  it('detects duplicate ids and slugs', () => {
    const errors = collectFeedErrors([
      makeEvent({ id: 'evt_dup', slug: 'dup-slug' }),
      makeEvent({ id: 'evt_dup', slug: 'dup-slug' }),
    ]);
    expect(errors).toContain('duplicate id: evt_dup');
    expect(errors).toContain('duplicate slug: dup-slug');
  });

  it('flags approved events with low source confidence', () => {
    const event = makeEvent();
    event.source.confidence = 0.3;
    expect(collectFeedErrors([event])).toContain('evt_test: approved event has low confidence');
  });

  it('ignores risk flags by default', () => {
    const event = makeEvent({
      moderation: { status: 'approved', risk_flags: ['seed-fixture-verify-before-public-launch'] },
    });
    expect(collectFeedErrors([event])).toEqual([]);
  });

  it('release mode fails events that still carry risk flags', () => {
    const event = makeEvent({
      moderation: { status: 'approved', risk_flags: ['seed-fixture-verify-before-public-launch'] },
    });
    expect(collectFeedErrors([event], { release: true })).toContain(
      'evt_test: unresolved risk flags in release mode: seed-fixture-verify-before-public-launch',
    );
  });
});

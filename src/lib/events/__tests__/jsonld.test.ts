import { describe, expect, it } from 'vitest';
import { eventToJsonLd } from '../jsonld';
import { makeEvent } from './factories';

describe('eventToJsonLd', () => {
  it.each([
    ['scheduled', 'https://schema.org/EventScheduled'],
    ['cancelled', 'https://schema.org/EventCancelled'],
    ['postponed', 'https://schema.org/EventPostponed'],
    ['tentative', 'https://schema.org/EventScheduled'],
    ['past',      'https://schema.org/EventScheduled'],
  ] as const)('maps status=%s to %s', (status, expected) => {
    const jsonld = eventToJsonLd(makeEvent({ status }));
    expect(jsonld.eventStatus).toBe(expected);
  });
});

import { describe, expect, it } from 'vitest';
import { eventToJsonLd, itemListJsonLd } from '../jsonld';
import { makeEvent } from './factories';

describe('eventToJsonLd', () => {
  it.each([
    ['scheduled', 'https://schema.org/EventScheduled'],
    ['cancelled', 'https://schema.org/EventCancelled'],
    ['postponed', 'https://schema.org/EventPostponed'],
    ['tentative', 'https://schema.org/EventScheduled'],
    ['past',      'https://schema.org/EventScheduled'],
  ] as const)('maps status=%s to %s', (status, expected) => {
    const jsonld = eventToJsonLd(makeEvent({ status }), 'https://test.example.com');
    expect(jsonld.eventStatus).toBe(expected);
  });

  it('uses the provided site as the URL prefix for url and @id', () => {
    const event = makeEvent({});
    const jsonld = eventToJsonLd(event, 'https://test.example.com');
    expect(jsonld.url).toBe(`https://test.example.com/events/${event.slug}/`);
    expect(jsonld['@id']).toBe(`https://test.example.com/events/${event.slug}/#event`);
  });
});

describe('itemListJsonLd', () => {
  it('uses the provided site as the URL prefix for each item', () => {
    const event = makeEvent({});
    const list = itemListJsonLd([event], 'https://test.example.com');
    expect(list.itemListElement[0].url).toBe(`https://test.example.com/events/${event.slug}/`);
  });
});

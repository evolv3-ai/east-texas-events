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

  const ticketsUrl = 'https://example.com/tickets';

  it('states price 0 for a free event with a ticket link', () => {
    const jsonld = eventToJsonLd(
      makeEvent({ admission: { is_free: true, availability: 'available', currency: 'USD', purchase_url: ticketsUrl } }),
      'https://test.example.com',
    );
    expect(jsonld.offers).toMatchObject({ url: ticketsUrl, price: 0, priceCurrency: 'USD' });
  });

  it('states price_min for a priced event', () => {
    const jsonld = eventToJsonLd(
      makeEvent({ admission: { price_min: 25, price_max: 50, availability: 'available', currency: 'USD', purchase_url: ticketsUrl } }),
      'https://test.example.com',
    );
    expect(jsonld.offers).toMatchObject({ url: ticketsUrl, price: 25, priceCurrency: 'USD' });
  });

  it('omits price and priceCurrency when the price is unknown but keeps the ticket url', () => {
    const jsonld = eventToJsonLd(
      makeEvent({ admission: { requires_ticket: true, availability: 'unknown', currency: 'USD', purchase_url: ticketsUrl } }),
      'https://test.example.com',
    );
    expect(jsonld.offers).toMatchObject({ '@type': 'Offer', url: ticketsUrl });
    expect(jsonld.offers).not.toHaveProperty('price');
    expect(jsonld.offers).not.toHaveProperty('priceCurrency');
  });
});

describe('itemListJsonLd', () => {
  it('uses the provided site as the URL prefix for each item', () => {
    const event = makeEvent({});
    const list = itemListJsonLd([event], 'https://test.example.com');
    expect(list.itemListElement[0].url).toBe(`https://test.example.com/events/${event.slug}/`);
  });
});

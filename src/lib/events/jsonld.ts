import type { CanonicalEvent } from './schema';

export function eventToJsonLd(event: CanonicalEvent, site = 'https://www.shallowcreek.com') {
  const url = `${site}/events/${event.slug}/`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': `${url}#event`,
    name: event.title,
    description: event.description ?? event.agent_summary,
    startDate: event.start_at,
    endDate: event.end_at,
    eventStatus: `https://schema.org/${event.status === 'cancelled' ? 'EventCancelled' : 'EventScheduled'}`,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url,
    location: {
      '@type': 'Place',
      name: event.location.name ?? `${event.location.city}, ${event.location.region}`,
      address: {
        '@type': 'PostalAddress',
        streetAddress: event.location.address1,
        addressLocality: event.location.city,
        addressRegion: event.location.region,
        postalCode: event.location.postal_code,
        addressCountry: event.location.country,
      },
      ...(event.location.latitude && event.location.longitude
        ? { geo: { '@type': 'GeoCoordinates', latitude: event.location.latitude, longitude: event.location.longitude } }
        : {}),
    },
    organizer: {
      '@type': 'Organization',
      name: event.source.name,
      url: event.source.source_url,
    },
    offers: event.admission.purchase_url || event.links.tickets_url ? {
      '@type': 'Offer',
      url: event.admission.purchase_url ?? event.links.tickets_url,
      priceCurrency: event.admission.currency,
      availability: event.admission.availability === 'sold_out' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      price: event.admission.price_min ?? 0,
    } : undefined,
    isAccessibleForFree: event.admission.is_free,
  };
}

export function itemListJsonLd(events: CanonicalEvent[], site = 'https://www.shallowcreek.com') {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'East Texas Events',
    itemListElement: events.map((event, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${site}/events/${event.slug}/`,
      name: event.title,
    })),
  };
}

import { getEventsFeed } from '@/lib/events/data';
import { eventsToIcs } from '@/lib/events/ics';

export function GET() {
  const site = (import.meta.env.SITE ?? 'https://events.shallowcreek.com').replace(/\/$/, '');
  return new Response(eventsToIcs(getEventsFeed(), site), {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}

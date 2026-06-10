import { getEventsFeed } from '@/lib/events/data';
import { eventsToRss } from '@/lib/events/rss';

export function GET() {
  const site = (import.meta.env.SITE ?? 'https://events.shallowcreek.com').replace(/\/$/, '');
  return new Response(eventsToRss(getEventsFeed(), site), {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}

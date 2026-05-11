import { getEventsFeed } from '@/lib/events/data';

export function GET() {
  return new Response(JSON.stringify(getEventsFeed(), null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}

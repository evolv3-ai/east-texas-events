import { getEventsFeed } from '@/lib/events/data';

export function GET() {
  const feed = getEventsFeed();
  return new Response(JSON.stringify({
    openapi: '3.1.0',
    info: {
      title: 'East Texas Events API',
      version: feed.schema_version,
      description: 'Static-first, agent-oriented East Texas events feed launching first on ShallowCreek.com.',
    },
    paths: {
      '/events.json': {
        get: {
          summary: 'List approved public East Texas events',
          responses: {
            '200': {
              description: 'Public event feed with source attribution and agent-friendly metadata',
            },
          },
        },
      },
      '/llms.txt': {
        get: {
          summary: 'Agent usage guide',
          responses: { '200': { description: 'Plain-text agent instructions' } },
        },
      },
    },
  }, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

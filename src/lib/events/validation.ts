import type { CanonicalEvent } from './schema';

export interface FeedValidationOptions {
  release?: boolean;
}

export function collectFeedErrors(
  events: CanonicalEvent[],
  options: FeedValidationOptions = {},
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (const event of events) {
    if (ids.has(event.id)) errors.push(`duplicate id: ${event.id}`);
    ids.add(event.id);
    if (slugs.has(event.slug)) errors.push(`duplicate slug: ${event.slug}`);
    slugs.add(event.slug);
    if (!event.links.source_url) errors.push(`${event.id}: missing source_url`);
    if (!event.agent_summary) errors.push(`${event.id}: missing agent_summary`);
    if (event.moderation.status === 'approved' && event.source.confidence < 0.5) {
      errors.push(`${event.id}: approved event has low confidence`);
    }
    if (options.release && event.moderation.risk_flags.length > 0) {
      errors.push(
        `${event.id}: unresolved risk flags in release mode: ${event.moderation.risk_flags.join(', ')}`,
      );
    }
  }

  return errors;
}

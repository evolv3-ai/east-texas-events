import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import BrowseIndex from '@/components/BrowseIndex.astro';

const render = async (...args: Parameters<AstroContainer['renderToString']>) =>
  (await AstroContainer.create()).renderToString(...args);

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); });
afterEach(() => { vi.useRealTimers(); });

describe('rendered browse index', () => {
  it.each(['cities', 'categories'] as const)('renders a helpful empty %s index with no detail links after events expire', async kind => {
    vi.setSystemTime(new Date('2100-01-01T00:00:00Z'));
    const html = await render(BrowseIndex, { props: { kind } });
    expect(html).toContain('No upcoming events are currently listed.');
    expect(html).toContain('href="/events/"');
    expect(html).toContain(`href="/events/${kind}/"`);
    expect(html).not.toMatch(new RegExp(`href="/events/${kind}/[^"]+"`));
  });
});

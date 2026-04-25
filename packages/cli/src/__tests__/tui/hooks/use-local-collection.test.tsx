import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { useLocalCollection } from '../../../tui/hooks/use-local-collection.js';
import { delay } from '../helpers.js';
import type { ContentResponse } from '@ccam/sdk';

function mockContentResponse<T>(content: T[]): ContentResponse<T> {
  return { content, links: [] };
}

let _retry: (() => void) | null = null;

function Harness<T>({ fetchFn }: { fetchFn: () => Promise<ContentResponse<T>> }) {
  const state = useLocalCollection(fetchFn);
  _retry = state.retry;
  if (state.loading) return <Text>LOADING</Text>;
  if (state.error) return <Text>ERROR:{state.error.message}</Text>;
  return <Text>DATA:{state.data.length}</Text>;
}

describe('useLocalCollection', () => {
  it('shows loading then data', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      mockContentResponse([{ id: '1' }, { id: '2' }, { id: '3' }]),
    );
    const { lastFrame } = render(<Harness fetchFn={fetchFn} />);

    expect(lastFrame()).toContain('LOADING');
    await delay();
    expect(lastFrame()).toContain('DATA:3');
  });

  it('shows error on fetch failure', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('forbidden'));
    const { lastFrame } = render(<Harness fetchFn={fetchFn} />);

    await delay();
    expect(lastFrame()).toContain('ERROR:forbidden');
  });

  it('fetches once on mount', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockContentResponse([]));
    render(<Harness fetchFn={fetchFn} />);

    await delay();
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('retry re-fetches from scratch', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(mockContentResponse([{ id: '1' }]))
      .mockResolvedValueOnce(mockContentResponse([{ id: '1' }, { id: '2' }]));
    const { lastFrame } = render(<Harness fetchFn={fetchFn} />);

    await delay();
    expect(lastFrame()).toContain('DATA:1');

    _retry!();
    await delay();

    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(lastFrame()).toContain('DATA:2');
  });

  it('handles empty content', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockContentResponse([]));
    const { lastFrame } = render(<Harness fetchFn={fetchFn} />);

    await delay();
    expect(lastFrame()).toContain('DATA:0');
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { useResourceDetail } from '../../tui/hooks/use-resource-detail.js';
import { delay } from './helpers.js';

function Harness({ fetchFn }: { fetchFn: () => Promise<unknown> }) {
  const state = useResourceDetail(fetchFn);
  if (state.loading) return <Text>LOADING</Text>;
  if (state.error) return <Text>ERROR:{state.error.message}</Text>;
  return <Text>DATA:{JSON.stringify(state.data)}</Text>;
}

describe('useResourceDetail', () => {
  it('shows loading then data', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ id: '1', name: 'Acme' });
    const { lastFrame } = render(<Harness fetchFn={fetchFn} />);

    expect(lastFrame()).toContain('LOADING');
    await delay();
    expect(lastFrame()).toContain('Acme');
  });

  it('shows error on failure', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('not found'));
    const { lastFrame } = render(<Harness fetchFn={fetchFn} />);

    await delay();
    expect(lastFrame()).toContain('ERROR:not found');
  });
});

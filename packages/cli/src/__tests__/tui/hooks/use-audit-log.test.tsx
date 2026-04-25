import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { useAuditLog } from '../../../tui/hooks/use-audit-log.js';
import { delay } from '../helpers.js';
import type { ContentResponse, AuditLogRecord } from '@ccam/sdk';

function mockAuditResponse(count: number): ContentResponse<AuditLogRecord> {
  const content: AuditLogRecord[] = Array.from({ length: count }, (_, i) => ({
    authorId: `user-${i}`,
    authorDisplayName: `User ${i}`,
    authorEmail: `user${i}@example.com`,
    eventType: 'LOGIN',
    eventMessage: `Event ${i}`,
    supportTicketId: '',
    timestamp: '2024-01-01T00:00:00Z',
    arguments: null,
    links: [],
  }));
  return { content, links: [] };
}

let _actions: {
  loadMore: () => void;
  confirmLoadAll: () => void;
  retry: () => void;
} | null = null;

function Harness({
  fetchFn,
}: {
  fetchFn: (querySize?: number) => Promise<ContentResponse<AuditLogRecord>>;
}) {
  const state = useAuditLog(fetchFn);
  _actions = {
    loadMore: state.loadMore,
    confirmLoadAll: state.confirmLoadAll,
    retry: state.retry,
  };
  if (state.loading) return <Text>LOADING</Text>;
  if (state.error) return <Text>ERROR:{state.error.message}</Text>;
  return (
    <Text>
      DATA:{state.data.length}|CAN:{state.canLoadMore ? 'y' : 'n'}|CONFIRM:
      {state.needsConfirmation ? 'y' : 'n'}
    </Text>
  );
}

describe('useAuditLog', () => {
  it('initial fetch with querySize=25', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockAuditResponse(10));
    const { lastFrame } = render(<Harness fetchFn={fetchFn} />);

    expect(lastFrame()).toContain('LOADING');
    await delay();

    expect(fetchFn).toHaveBeenCalledWith(25);
    expect(lastFrame()).toContain('DATA:10');
    expect(lastFrame()).toContain('CAN:y');
    expect(lastFrame()).toContain('CONFIRM:n');
  });

  it('shows error on fetch failure', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('network error'));
    const { lastFrame } = render(<Harness fetchFn={fetchFn} />);

    await delay();
    expect(lastFrame()).toContain('ERROR:network error');
  });

  it('loadMore steps through 25 -> 50 -> 100', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockAuditResponse(5));
    const { lastFrame } = render(<Harness fetchFn={fetchFn} />);
    await delay();

    // Step to 50
    fetchFn.mockClear();
    _actions!.loadMore();
    await delay();
    expect(fetchFn).toHaveBeenCalledWith(50);
    expect(lastFrame()).toContain('CAN:y');
    expect(lastFrame()).toContain('CONFIRM:n');

    // Step to 100
    fetchFn.mockClear();
    _actions!.loadMore();
    await delay();
    expect(fetchFn).toHaveBeenCalledWith(100);
    expect(lastFrame()).toContain('CAN:y');
    expect(lastFrame()).toContain('CONFIRM:y');
  });

  it('loadMore replaces data, not appends', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(mockAuditResponse(3))
      .mockResolvedValueOnce(mockAuditResponse(7));
    const { lastFrame } = render(<Harness fetchFn={fetchFn} />);
    await delay();

    expect(lastFrame()).toContain('DATA:3');

    _actions!.loadMore();
    await delay();

    expect(lastFrame()).toContain('DATA:7');
  });

  it('after querySize=100, needsConfirmation is true and loadMore is no-op', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockAuditResponse(5));
    render(<Harness fetchFn={fetchFn} />);
    await delay();

    // Step to 50
    _actions!.loadMore();
    await delay();

    // Step to 100
    _actions!.loadMore();
    await delay();

    // loadMore should be no-op now (needs confirmation)
    fetchFn.mockClear();
    _actions!.loadMore();
    await delay();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('confirmLoadAll fetches with querySize=undefined', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockAuditResponse(5));
    const { lastFrame } = render(<Harness fetchFn={fetchFn} />);
    await delay();

    // Step through to 100
    _actions!.loadMore();
    await delay();
    _actions!.loadMore();
    await delay();

    // Confirm load all
    fetchFn.mockClear();
    _actions!.confirmLoadAll();
    await delay();

    expect(fetchFn).toHaveBeenCalledWith(undefined);
    expect(lastFrame()).toContain('CAN:n');
    expect(lastFrame()).toContain('CONFIRM:n');
  });

  it('after loading all, canLoadMore is false', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockAuditResponse(50));
    const { lastFrame } = render(<Harness fetchFn={fetchFn} />);
    await delay();

    _actions!.confirmLoadAll();
    await delay();

    expect(lastFrame()).toContain('CAN:n');
  });

  it('retry resets to initial state and fetches querySize=25', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockAuditResponse(5));
    render(<Harness fetchFn={fetchFn} />);
    await delay();

    // Step to 50
    _actions!.loadMore();
    await delay();

    // Retry should reset
    fetchFn.mockClear();
    _actions!.retry();
    await delay();

    expect(fetchFn).toHaveBeenCalledWith(25);
  });
});
